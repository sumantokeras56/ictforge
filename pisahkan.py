from bs4 import BeautifulSoup
import os

# Nama file input Anda
input_file = 'index.html'
folder_output = 'hasil_pemisahan'

# 1. Cek apakah file input ada
if not os.path.exists(input_file):
    print(f"Error: File '{input_file}' tidak ditemukan!")
    exit()

# 2. Buat folder untuk menyimpan hasil jika belum ada
if not os.path.exists(folder_output):
    os.makedirs(folder_output)

# 3. Baca isi file HTML
print(f"Membaca {input_file}...")
with open(input_file, 'r', encoding='utf-8') as f:
    konten_html = f.read()

# 4. Parse HTML menggunakan BeautifulSoup
soup = BeautifulSoup(konten_html, 'html.parser')

# --- BAGIAN CSS ---
css_kode = ""
# Cari semua tag <style>
for style_tag in soup.find_all('style'):
    css_kode += style_tag.get_text() + "\n"
    style_tag.decompose() # Hapus tag <style> dari HTML utama

# --- BAGIAN JAVASCRIPT ---
js_kode = ""
# Cari semua tag <script> yang TIDAK punya atribut 'src' (inline script)
for script_tag in soup.find_all('script'):
    if not script_tag.get('src'):
        js_kode += script_tag.get_text() + "\n"
        script_tag.decompose() # Hapus tag <script> dari HTML utama

# --- MENYIMPAN FILE ---

# A. Simpan CSS jika ada isinya
if css_kode.strip():
    nama_css = 'style.css'
    with open(os.path.join(folder_output, nama_css), 'w', encoding='utf-8') as f:
        f.write(css_kode)
    
    # Masukkan link CSS ke dalam <head> HTML
    link_css = soup.new_tag('link', rel='stylesheet', href=nama_css)
    if soup.head:
        soup.head.append(link_css)
    print("-> File CSS dibuat.")

# B. Simpan JS jika ada isinya
if js_kode.strip():
    nama_js = 'script.js'
    with open(os.path.join(folder_output, nama_js), 'w', encoding='utf-8') as f:
        f.write(js_kode)
        
    # Masukkan link JS ke dalam <body> HTML (di bagian akhir)
    tag_script_baru = soup.new_tag('script', src=nama_js)
    if soup.body:
        soup.body.append(tag_script_baru)
    print("-> File JS dibuat.")

# C. Simpan HTML yang sudah bersih
nama_html_baru = 'index_clean.html'
with open(os.path.join(folder_output, nama_html_baru), 'w', encoding='utf-8') as f:
    # prettify membuat tampilan kode lebih rapi (opsional)
    f.write(soup.prettify()) 

print("-> File HTML bersih dibuat.")
print(f"\nSelesai! Silakan cek folder '{folder_output}'.")