import os

ROOT_DIR = "/home/ayeshamashiat/Documents/Personal Items/CodeSprint/CareerPilor_CodeSprint"
OUTPUT_FILE = "project_dump.txt"

# folders you DO NOT want to include
IGNORE_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    "venv",
    "env",
    "dist",
    "build",
}

# file types you probably don't want to dump
IGNORE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".mp4", ".mov", ".avi",
    ".zip", ".tar", ".gz",
    ".exe", ".dll",
    ".pyc",
}


def should_ignore_dir(dir_name):
    return dir_name in IGNORE_DIRS


def should_ignore_file(file_name):
    _, ext = os.path.splitext(file_name)
    return ext in IGNORE_EXTENSIONS


def read_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return "[UNREADABLE FILE - binary or encoding issue]"


def write_tree(path, output_file, root):
    rel_path = os.path.relpath(path, root)
    depth = 0 if rel_path == "." else rel_path.count(os.sep)
    indent = "    " * depth

    folder_name = os.path.basename(path)

    output_file.write(f"{indent}{folder_name}/\n")

    try:
        entries = os.listdir(path)
    except PermissionError:
        output_file.write(f"{indent}    [Permission Denied]\n")
        return

    # separate dirs and files
    dirs = []
    files = []

    for entry in entries:
        full_path = os.path.join(path, entry)
        if os.path.isdir(full_path):
            if not should_ignore_dir(entry):
                dirs.append(full_path)
        else:
            if not should_ignore_file(entry):
                files.append(full_path)

    # write files
    for file_path in files:
        file_name = os.path.basename(file_path)
        file_indent = "    " * (depth + 1)

        output_file.write(f"{file_indent}{file_name}\n")

        content = read_file(file_path)

        content_lines = content.splitlines()

        for line in content_lines:
            output_file.write(f"{file_indent}    {line}\n")

        output_file.write("\n")

    # recurse into directories
    for dir_path in dirs:
        write_tree(dir_path, output_file, root)


def main():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write(f"PROJECT DUMP: {ROOT_DIR}\n")
        out.write("=" * 80 + "\n\n")

        write_tree(ROOT_DIR, out, ROOT_DIR)

    print(f"Done. Output saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
