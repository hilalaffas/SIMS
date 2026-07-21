// File: src/utils/dateUtils.js
export const hariLiburNasional = [];

export const hitungBatasMinTanggal = (jumlahHariKerja, daftarHariLibur = []) => {
  let date = new Date();
  let sisaHari = jumlahHariKerja;

  while (sisaHari > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isTanggalMerah = daftarHariLibur.includes(dateStr);

    if (!isWeekend && !isTanggalMerah) {
      sisaHari--;
    }
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};