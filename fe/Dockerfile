# Gunakan base image Node.js versi Alpine (ringan)
FROM node:18-alpine

# Tentukan folder kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Installdependencies
RUN npm install

# Salin seluruh sisa file project ke dalam container
COPY . .

# Buka port yang digunakan frontend (misal: 5173 untuk Vite atau 3000 untuk React)
EXPOSE 5173

# Jalankan perintah untuk mendeploy/menjalankan server development
CMD ["npm", "run", "dev", "--", "--host"]