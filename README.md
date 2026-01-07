# <img width="766" height="150" alt="fileark" src="https://github.com/user-attachments/assets/0c22f56d-173e-434b-a03c-e41aa513f4f9" />

**File Ark** is a desktop application that helps you quickly harvest and organize important files before a system refresh, migration, or backup. Built with Electron, it works on Windows, macOS, and Linux.
It uses file extensions (by category) with some filesize gates to prevent useless stub files (like 1px gifs etc.). Because it doesn't care about filenames, but only extensions and sizes, it's fast to find all your files.

<img width="586" height="1029" alt="image" src="https://github.com/user-attachments/assets/875fddc1-f197-4da3-838f-c18c5c6a9f85" />

## ✨ Features

- **Smart File Discovery** - Scans folders for creative files (images, vectors, design files, 3D, video, audio, documents)
- **Category-Based Organization** - Automatically sorts files into folders by type
- **Per-Extension Control** - Expand categories to include/exclude specific file types
- **Size Filtering** - Set minimum file sizes per category to skip small files
- **Subfolder by Extension** - Optionally organize into `Images/PNG`, `Images/JPG`, etc.
- **Original Path Tracking** - Save the source folder path in sidecar files for traceability
- **Cancel Anytime** - Stop mid-copy with the "Abandon Ship!" button
- **Manifest File** - Generates `_manifest.json` with full copy report

## 📥 Installation

### Download Release
1. Go to [Releases](https://github.com/KDB-USJP/FileArk/releases)
2. Download the installer for your platform:
   - **Windows:** `File Ark Setup.exe`
   - **macOS:** `File Ark.dmg`
   - **Linux:** `File Ark.AppImage`

### Build from Source
```bash
git clone https://github.com/KDB-USJP/FileArk.git
cd FileArk
npm install
npm start
```

## 🚀 Usage

### Basic Workflow

1. **Select Source** - Click "Browse" next to Source to choose the folder to scan
2. **Select Output** - Click "Browse" next to Output to choose where files will be copied
3. **Choose Categories** - Check the file types you want to collect
4. **Adjust Size Thresholds** - Use dropdowns to set minimum file sizes (filters out small files)
5. **Click "All Aboard!"** - Start the harvest

### Expanding Categories

Click the **▶** arrow next to any category to expand it and see individual file extensions. Uncheck any you don't need.

![Category Expansion](category-expansion.png)

### Settings ⚙️

Click the gear icon to access settings:

| Setting | Description |
|---------|-------------|
| **Subfolder by Extension** | Creates subfolders like `Images/PNG`, `Images/JPG` |
| **Embed Original Path** | Creates `.origin.txt` files with source location |
| **Ignore Temp/Cache** | Skips Temp, Cache, and similar folders |
| **Ignore System** | Skips Windows, Program Files, AppData, etc. |
| **Custom Exclude** | Add folder names to skip (comma-separated) |

![Settings Panel](settings.png)

### Custom Extensions

Add your own file extensions in the "Custom extensions" field:
```
.kra, .procreate, .aseprite
```

### Output Structure

```
Output Folder/
├── Images/
│   ├── photo1.jpg
│   └── photo2.png
├── Vector/
│   ├── logo.ai
│   └── icon.svg
├── Design/
│   └── mockup.psd
├── 3D/
│   └── model.blend
└── _manifest.json
```

With **Subfolder by Extension** enabled:
```
Output Folder/
├── Images/
│   ├── JPG/
│   │   └── photo1.jpg
│   └── PNG/
│       └── photo2.png
└── _manifest.json
```

With **Embed original folder path in file comments (where supported)** enabled:
```
The system will create a text file alongside the original file, named the same as the file, with the original file location. This allows you to use full-text search tools to locate files that might have been insufficiently named (for example, "mockup.jpg" or "photo_1876_ex.jpg) to be findable, using elements from their original pathnames (projectX\mockup.jpg, or mywedding\photo_1876_ex.jpg)
```

## 📋 Supported File Types

| Category | Extensions |
|----------|------------|
| Images | jpg, jpeg, png, gif, tiff, webp, heic, raw, cr2, cr3, nef, arw, dng, orf |
| Vector | ai, eps, svg, pdf |
| Design | psd, psb, indd, indt, xd, fig, sketch, afdesign, afphoto |
| 3D | blend, c4d, ma, mb, 3ds, skp, obj, fbx, dae, stl, gltf, glb |
| Video | mp4, mov, avi, mkv, wmv, prproj, aep, drp |
| Audio | mp3, wav, aiff, flac, ogg, m4a, aac |
| Documents | doc, docx, xls, xlsx, ppt, pptx, txt, md, rtf |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with 🚢 for artists facing system refreshes.
