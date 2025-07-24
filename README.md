# StringArtGen

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.19.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.



# 🧵 String Art Generator

A web-based tool to convert images into nail-to-nail string art using a greedy optimization algorithm. Built with **Angular (frontend)** and **Node.js (backend)** — no UI libraries, just native HTML/CSS and SVG/Canvas.

---

## 🚀 Features

- 🖼️ Upload image (JPG/PNG)
- 🔘 Set number of nails (e.g., 256)
- 🧶 Set number of strings (e.g., 2000)
- 📐 Backend computes optimal nail-to-nail connections
- 🖍️ Frontend renders preview using SVG or Canvas
- 📥 Export string instructions as downloadable JSON

---

## 🛠️ Tech Stack

| Layer     | Technology                         |
|-----------|-------------------------------------|
| Frontend  | Angular (TypeScript), HTML, SCSS    |
| Backend   | Node.js, Express                    |
| Image Proc| `sharp`, `multer`, `cors`           |
| Preview   | HTML5 `<canvas>` or `<svg>`         |
| Format    | JSON output of coordinates          |

---

## 📁 Project Structure

string-art-generator/
├── frontend/                 # Angular app  
│   ├── src/app/  
│   │   ├── components/       # Upload, Preview, Export  
│   │   ├── services/         # API communication  
│   │   └── models/           # Type interfaces  
│   └── angular.json  
├── backend/                  # Node.js app  
│   ├── controllers/          # Request logic  
│   ├── services/             # Core string art algorithm  
│   ├── routes/               # API routing  
│   ├── uploads/              # Temporary image store  
│   └── index.js              # App entry point  
└── README.md

---

## 🧠 How It Works

### 🔵 Nail Layout

- Nails are placed **evenly spaced** on a circle.
- Example: 256 nails → each 1.40625° apart.
- Each nail has (x, y) coordinates on the perimeter.

### 🧮 Greedy Optimization Algorithm

1. Convert image to grayscale.
2. Blur/normalize to smooth detail.
3. For `K` iterations:
   - From current nail, evaluate every possible `to` nail.
   - Draw virtual line and measure how much it **reduces darkness** along that path.
   - Select the line that maximizes darkness reduction.
   - Update pixel buffer and continue.

---

## 📦 API Reference

### POST `/generate`

**Description:** Generate string art coordinates from image + parameters.

#### Request
- `multipart/form-data`:
  - `image` (File): JPG or PNG
  - `nails` (Number): Count of nails (50–512)
  - `strings` (Number): Number of string connections (100–3000)

#### Response
```json
{
  "nails": 256,
  "strings": 2000,
  "coordinates": [
    { "from": 0, "to": 87 },
    { "from": 87, "to": 146 }
  ]
}

