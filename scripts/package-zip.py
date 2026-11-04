import zipfile
import os
import sys

output_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/nasir-mobile-dubai-source-code.zip'
root_dir = os.path.abspath('.')

excluded_dirs = {'node_modules', '.git', 'dist', 'build', '.cache', '__pycache__'}
excluded_exts = {'.zip', '.tar.gz', '.tgz', '.DS_Store', '.log'}

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(root_dir):
        # Skip excluded dirs in-place
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in excluded_exts):
                continue
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, root_dir)
            z.write(full_path, arcname)

print(f"Packaged {os.path.getsize(output_path)} bytes to {output_path}")
