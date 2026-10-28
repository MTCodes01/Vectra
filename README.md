# Vectra

Vectra is a browser-based image-to-SVG converter. Drop in or select an image, choose how it should be traced, and preview, download, or copy the generated SVG. Image processing happens in your browser.

## Features

- Upload an image by dragging it into the page or choosing a file.
- Convert images to full-color, black-and-white, outline, or outline-with-shading SVGs.
- Choose high, medium, or low detail and adjust outline detail.
- Preview the result, download it as an SVG, or copy its SVG markup.
- Switch between dark and light themes.
- Includes a web app manifest and service worker registration.

## Technologies

- HTML, CSS, and vanilla JavaScript
- [ImageTracerJS](https://github.com/jankovicsandras/imagetracerjs) 1.2.6, loaded from jsDelivr
- Browser APIs including Canvas, FileReader, and the Clipboard API

No package manager or build step is required. ImageTracerJS and the fonts are loaded from external CDNs.

## Setup

Clone the repository and enter its directory:

```sh
git clone https://github.com/Nivyasudeesh/Vectra.git
cd Vectra
```

## Run locally

Serve the project files from a local web server. For example, with Python:

```sh
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser. If Python is installed as `py` on Windows, you can instead run:

```powershell
py -m http.server 8000
```

Use a local server rather than opening `index.html` directly; this also allows the service worker to register. An internet connection is needed to load ImageTracerJS and the fonts from their CDNs.

## Usage

1. Drag an image onto the upload area or click it to browse for an image.
2. Select a color mode, detail level, and output style. For outline styles, adjust the outline detail slider.
3. Select **Apply to All** to generate and preview the SVG.
4. Choose **Download SVG** to save the result or **Copy Code** to copy its markup.
5. Use the theme toggle in the top-right corner to switch themes.

## Contributing

Contributions are welcome. Please follow the fork-and-pull-request workflow, branch naming conventions, and Conventional Commit format described in [CONTRIBUTING.md](CONTRIBUTING.md). For pull requests, complete the repository's [pull request template](.github/PULL_REQUEST_TEMPLATE.md), describe any related issue, and report the checks you ran.
