import os

html_files = []
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

updated_count = 0
for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<meta property="og:url"' in content and '<meta property="og:site_name"' not in content:
        new_content = content.replace('<meta property="og:url"', '<meta property="og:site_name" content="Online Keyboard Test">\n  <meta property="og:url"')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
        updated_count += 1

print(f"Total updated: {updated_count}")
