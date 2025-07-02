/**
 * Initialize Hybrid Storage Database
 * 
 * This script creates the necessary database tables for the hybrid storage system
 */

const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');

// Konfigurasi koneksi MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Ganti dengan user MySQL Anda
  password: '', // Ganti dengan password MySQL Anda
  multipleStatements: true
});

// Baca file SQL
const sqlPath = path.join(__dirname, '../database/init.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Eksekusi SQL
connection.query(sql, (err, results) => {
  if (err) {
    console.error('Gagal menjalankan SQL:', err);
    process.exit(1);
  }
  console.log('Inisialisasi database berhasil!');
  connection.end();
}); 