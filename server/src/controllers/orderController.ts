import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import pool, { getConnection } from '../config/database.js';
import { validateAndConvertFields } from '../utils/fieldValidator.js';
import { parseDate, toMySQLDateTime } from '../utils/dateUtils.js';

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Fetch orders
      const [orders] = await connection.execute(
        'SELECT * FROM orders ORDER BY order_date DESC'
      ) as any;

      // Fetch products for each order
      for (const order of orders) {
        const [products] = await connection.execute(
          'SELECT * FROM order_products WHERE order_id = ?',
          [order.id]
        ) as any;
        order.products = products;
      }

      res.json(orders);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ?', [id]) as any;
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = rows[0];
      
      // Fetch products for the order
      const [products] = await connection.execute(
        'SELECT * FROM order_products WHERE order_id = ?',
        [id]
      ) as any;
      order.products = products;
      
      res.json(order);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      id,
      leadId,
      callId,
      customerName,
      mobile,
      deliveryAddress,
      products,
      totalAmount,
      status,
      orderDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      agingDays,
      isDelayed,
      paymentStatus,
      invoiceNumber,
      assignedTo,
      remarks,
    } = req.body;

    // Validate required fields
    if (!id || !customerName || !mobile || !deliveryAddress || !totalAmount || !status || !orderDate || !expectedDeliveryDate || !paymentStatus || !assignedTo) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, customerName, mobile, deliveryAddress, totalAmount, status, orderDate, expectedDeliveryDate, paymentStatus, assignedTo' 
      });
    }

    // Parse and validate dates, then convert to MySQL format
    let mysqlOrderDate: string | null;
    let mysqlExpectedDeliveryDate: string | null;
    let mysqlActualDeliveryDate: string | null = null;

    try {
      const parsedOrderDate = parseDate(orderDate);
      if (!parsedOrderDate) {
        return res.status(400).json({ error: 'Invalid order date' });
      }
      mysqlOrderDate = toMySQLDateTime(parsedOrderDate);
      
      const parsedExpectedDeliveryDate = parseDate(expectedDeliveryDate);
      if (!parsedExpectedDeliveryDate) {
        return res.status(400).json({ error: 'Invalid expected delivery date' });
      }
      mysqlExpectedDeliveryDate = toMySQLDateTime(parsedExpectedDeliveryDate);
      
      if (actualDeliveryDate) {
        const parsedActualDeliveryDate = parseDate(actualDeliveryDate);
        if (parsedActualDeliveryDate) {
          mysqlActualDeliveryDate = toMySQLDateTime(parsedActualDeliveryDate);
        }
      }
    } catch (dateError) {
      return res.status(400).json({ 
        error: `Invalid date format: ${dateError instanceof Error ? dateError.message : String(dateError)}` 
      });
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Order must include at least one product' });
    }

    await connection.beginTransaction();
    try {
      // Insert order
      await connection.execute(
        `INSERT INTO orders 
         (id, lead_id, call_id, customer_name, mobile, delivery_address, total_amount,
          status, order_date, expected_delivery_date, actual_delivery_date, aging_days,
          is_delayed, payment_status, invoice_number, assigned_to, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, leadId || null, callId || null, customerName, mobile, deliveryAddress,
         totalAmount, status, mysqlOrderDate, mysqlExpectedDeliveryDate, mysqlActualDeliveryDate,
         agingDays || 0, isDelayed || false, paymentStatus, invoiceNumber || null,
         assignedTo, remarks || null]
      );

      // Insert order products
      for (const product of products) {
        if (!product.productId || !product.productName || !product.quantity || !product.unitPrice) {
          throw new Error(`Invalid product data: missing required fields`);
        }

        await connection.execute(
          `INSERT INTO order_products 
           (order_id, product_id, product_name, quantity, unit, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, product.productId, product.productName, product.quantity,
           product.unit || '', product.unitPrice, product.totalPrice]
        );

        // Update product quantity with validation
        const [result] = await connection.execute(
          'UPDATE products SET available_quantity = available_quantity - ? WHERE id = ? AND available_quantity >= ?',
          [product.quantity, product.productId, product.quantity]
        ) as any;
        
        if (result.affectedRows === 0) {
          throw new Error(`Insufficient inventory for product ${product.productName}`);
        }
      }

      await connection.commit();

      // Fetch complete order with products
      const [completeOrder] = await connection.execute(
        'SELECT * FROM orders WHERE id = ?',
        [id]
      ) as any;
      
      if (completeOrder.length === 0) {
        return res.status(500).json({ error: 'Failed to retrieve created order' });
      }

      const [orderProducts] = await connection.execute(
        'SELECT * FROM order_products WHERE order_id = ?',
        [id]
      ) as any;
      
      completeOrder[0].products = orderProducts;
      res.status(201).json(completeOrder[0]);
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    connection.release();
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate and convert fields safely
    const { values, setClause } = validateAndConvertFields('orders', updates);

    if (!setClause) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE orders SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id, ...values]
      );

      const [rows] = await connection.execute('SELECT * FROM orders WHERE id = ?', [id]) as any;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Fetch products for the order
      const [products] = await connection.execute(
        'SELECT * FROM order_products WHERE order_id = ?',
        [id]
      ) as any;
      rows[0].products = products;

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [id]) as any;

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ success: true, message: 'Order deleted' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
