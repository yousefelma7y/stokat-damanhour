import os

target_dir = r"src/app/api"
if not os.path.exists(target_dir):
    print(f"Directory not found: {target_dir}")
    exit(1)

count = 0
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith(".ts"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Replace standard double quote import
                new_content = content.replace('@/lib/api-response"', '@/lib/api-responses"')
                # Replace single quote import just in case
                new_content = new_content.replace("@/lib/api-response'", "@/lib/api-responses'")
                
                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Fixed {path}")
                    count += 1
            except Exception as e:
                print(f"Error processing {path}: {e}")

print(f"Total files fixed: {count}")
