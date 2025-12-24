#!/usr/bin/env python3
import os
import json
from pathlib import Path

def delete_original_files():
    """Delete all individual .md files that have been consolidated"""
    
    # Load categorization to get list of files to delete
    with open("file_categorization.json", 'r') as f:
        categorization = json.load(f)
    
    files_to_delete = []
    for category, files in categorization.items():
        files_to_delete.extend(files)
    
    # Also create helper files to delete
    helper_files = ["consolidate-files.ps1", "categorize_files.py", "create_consolidated_files.py", "file_categorization.json"]
    
    print("=" * 70)
    print("FILES TO BE DELETED")
    print("=" * 70)
    print(f"\nOriginal markdown files to delete: {len(files_to_delete)}")
    print(f"Helper files to delete: {len(helper_files)}")
    print(f"Total files to delete: {len(files_to_delete) + len(helper_files)}")
    
    # Count by category
    print("\n" + "=" * 70)
    print("DELETION SUMMARY BY CATEGORY")
    print("=" * 70)
    for category, files in categorization.items():
        print(f"\n{category}: {len(files)} files")
        for f in sorted(files)[:3]:
            print(f"  - {f}")
        if len(files) > 3:
            print(f"  ... and {len(files) - 3} more")
    
    print("\n" + "=" * 70)
    print("HELPER FILES")
    print("=" * 70)
    for f in helper_files:
        print(f"  - {f}")
    
    print("\n" + "=" * 70)
    print("CREATED CONSOLIDATED FILES (PRESERVED)")
    print("=" * 70)
    print("  - DEPLOYMENT_AND_INFRASTRUCTURE.md")
    print("  - FIXES_AND_TROUBLESHOOTING.md")
    print("  - FEATURES_AND_ENHANCEMENTS.md")
    print("  - MIGRATION_AND_DATABASE.md")
    print("  - README.md (NOT MODIFIED)")
    
    print("\n" + "=" * 70)
    
    # Ask for confirmation
    print("\nReady to delete all original files?")
    print("Type 'YES' to proceed or 'NO' to cancel: ", end="")
    response = input().strip().upper()
    
    if response != "YES":
        print("Deletion cancelled.")
        return
    
    # Delete original markdown files
    deleted_count = 0
    failed_count = 0
    
    print("\nDeleting original markdown files...")
    for filename in sorted(files_to_delete):
        filepath = Path(f"f:/Renuga-CRM-EC2-MySQL/{filename}")
        try:
            if filepath.exists():
                filepath.unlink()
                deleted_count += 1
                print(f"  ✓ Deleted {filename}")
        except Exception as e:
            print(f"  ✗ Failed to delete {filename}: {str(e)}")
            failed_count += 1
    
    # Delete helper files
    print("\nDeleting helper files...")
    for filename in helper_files:
        filepath = Path(f"f:/Renuga-CRM-EC2-MySQL/{filename}")
        try:
            if filepath.exists():
                filepath.unlink()
                deleted_count += 1
                print(f"  ✓ Deleted {filename}")
        except Exception as e:
            print(f"  ✗ Failed to delete {filename}: {str(e)}")
            failed_count += 1
    
    print("\n" + "=" * 70)
    print("DELETION COMPLETE")
    print("=" * 70)
    print(f"Successfully deleted: {deleted_count} files")
    print(f"Failed to delete: {failed_count} files")
    print("\n✓ Consolidation complete!")
    print("✓ All documentation is now in 4 consolidated markdown files")

if __name__ == "__main__":
    delete_original_files()

