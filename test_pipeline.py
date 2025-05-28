import os
from pathlib import Path

# Test file path
lease_file_path = "/Users/betojuareziii/Desktop/Atlas Data Co-Op/data/___2019-2022-Lease-Agreement-TETCO-[Signed]-tiny.pdf"

print("Testing lease document pipeline...")
print(f"Checking if file exists: {lease_file_path}")

if os.path.exists(lease_file_path):
    print("✅ File exists!")
    file_size = os.path.getsize(lease_file_path)
    print(f"File size: {file_size} bytes")
    
    # Test if we can read the file
    try:
        from llama_index.core import SimpleDirectoryReader
        reader = SimpleDirectoryReader(input_files=[lease_file_path])
        documents = reader.load_data()
        print(f"✅ Successfully loaded {len(documents)} document(s)")
        print(f"First document preview: {documents[0].text[:200]}...")
        
    except Exception as e:
        print(f"❌ Error loading document: {e}")
        
else:
    print("❌ File does not exist!")
    print("Please check the file path and make sure the file is accessible.") 