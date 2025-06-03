#!/usr/bin/env python3
"""
Test script to demonstrate that the lease_flags_query_pipeline can accept any file path.
"""

from lease_flags_query_pipeline import main

def test_with_different_file():
    """Test the pipeline with user input for file path."""
    print("Testing lease flags query pipeline with custom file path...")
    print("You can now use the pipeline with any lease document!")
    print()
    
    # Example of how to use the pipeline programmatically
    file_path = input("Enter the path to a lease document (or press Enter for default TETCO file): ").strip()
    
    if not file_path:
        file_path = "/Users/betojuareziii/Desktop/Atlas Data Co-Op/data/___2019-2022-Lease-Agreement-TETCO-[Signed]-tiny.pdf"
        print(f"Using default file: {file_path}")
    
    main(file_path)

if __name__ == "__main__":
    test_with_different_file() 