import { useState, useEffect, useRef } from 'react';
import {
  fetchEmployeeProfile,
  mapEmployeeToFormData,
  updateEmployeeProfile,
  changePassword as changePasswordApi,
} from '../services/profileApi'; // sesuaikan path import dengan struktur project Anda

// Helper: ambil inisial dari nama lengkap, dipakai saat foto profil belum diupload
export const getInitials = (fullName) => {
  if (!fullName) return "AS";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Semua state & handler ProfilePageBase dikumpulkan di sini, supaya komponen
// tampilan (ProfileViewSection, ProfileEditModal, dll) cukup terima props saja.
//
// employeeId TIDAK LAGI dibutuhkan sebagai parameter — backend sekarang
// punya endpoint self-service (GET & PUT /api/karyawan/me) yang otomatis
// tahu siapa user yang login dari token JWT, jadi hook ini cukup butuh
// currentUserRole saja (untuk aturan lock field).
export const useProfileForm = (currentUserRole) => {
  const [isEditing, setIsEditing] = useState(false); // Kontrol buka/tutup modal edit
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [profileImage, setProfileImage] = useState(null); // preview (base64) untuk foto yang BELUM disimpan
  const [chosenFileName, setChosenFileName] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null); // File asli untuk dikirim ke backend saat save
  const [toast, setToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  // Data profil yang tampil di halaman (data tersimpan/final, hasil GET dari backend)
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nikKaryawan: '',
    jabatan: '',
    alamatLengkap: '',
    email: '',
    nomorTelepon: '',
    divisi: '',
    tanggalBergabung: '',
    nomorTeleponDarurat: '',
    hubunganDarurat: '',
    photoUrl: null,
  });

  // Data sementara yang diketik user di dalam form edit — belum tersimpan sampai klik "Simpan Perubahan"
  const [draftData, setDraftData] = useState(formData);

  // Form ganti kata sandi — terpisah dari data profil, dikosongkan tiap buka/tutup form edit
  const [passwordData, setPasswordData] = useState({
    kataSandiLama: '',
    kataSandiBaru: '',
    ulangiSandiBaru: ''
  });
  const [passwordError, setPasswordError] = useState('');

  // --- Load profil dari backend ---
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    fetchEmployeeProfile()
      .then((employee) => {
        if (cancelled) return;
        const mapped = mapEmployeeToFormData(employee);
        setFormData(mapped);
        setDraftData(mapped);
        if (mapped.photoUrl) {
          // Sesuaikan base URL statik ini dengan cara backend serve file di `uploads/photos/`
          setProfileImage(mapped.photoUrl);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Gagal memuat profil');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentUserRole]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Buka form edit: salin data terbaru ke draft, kosongkan form kata sandi
  const openEdit = () => {
    setDraftData(formData);
    setPasswordData({ kataSandiLama: '', kataSandiBaru: '', ulangiSandiBaru: '' });
    setPasswordError('');
    setSaveError('');
    setChosenFileName('');
    setSelectedPhotoFile(null);
    setIsEditing(true);
  };

  const closeEdit = () => setIsEditing(false);

  // Perubahan di form hanya mengubah draftData, bukan formData langsung
  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    setDraftData({ ...draftData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    setPasswordError('');
  };

  // Foto: hanya preview + simpan File asli di state. Upload sungguhan
  // terjadi saat handleSave, dikirim sebagai bagian dari multipart form data.
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setChosenFileName(file.name);
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Simpan Perubahan ke backend
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    // Validasi kata sandi hanya jika user memang mengisinya
    const inginGantiSandi = passwordData.kataSandiBaru || passwordData.ulangiSandiBaru;
    if (inginGantiSandi) {
      if (!passwordData.kataSandiLama) {
        setPasswordError('Masukkan kata sandi lama untuk mengonfirmasi perubahan.');
        return;
      }
      if (passwordData.kataSandiBaru.length < 8) {
        setPasswordError('Kata sandi baru minimal 8 karakter.');
        return;
      }
      if (passwordData.kataSandiBaru !== passwordData.ulangiSandiBaru) {
        setPasswordError('Kata sandi baru dan pengulangannya tidak sama.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Update data profil (selalu jalan)
      const updatedEmployee = await updateEmployeeProfile(draftData, selectedPhotoFile);
      const mapped = mapEmployeeToFormData(updatedEmployee);
      setFormData(mapped);
      setProfileImage(mapped.photoUrl || profileImage);

      // 2. Ganti password (endpoint terpisah dari update profil)
      if (inginGantiSandi) {
        await changePasswordApi({
          oldPassword: passwordData.kataSandiLama,
          newPassword: passwordData.kataSandiBaru,
          confirmPassword: passwordData.ulangiSandiBaru,
        });
      }

      setSaving(false);
      setIsEditing(false);
      setSelectedPhotoFile(null);

      // Tampilkan toast notifikasi di kanan bawah
      setToast(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(false), 3500);
    } catch (err) {
      setSaving(false);
      // Pesan error dari backend (mis. "Password lama salah") ditampilkan apa adanya
      if (inginGantiSandi && /password/i.test(err.message || '')) {
        setPasswordError(err.message);
      } else {
        setSaveError(err.message || 'Gagal menyimpan perubahan. Coba lagi.');
      }
    }
  };

  return {
    isEditing, loading, loadError, profileImage, chosenFileName, toast, saving, saveError,
    fileInputRef, formData, draftData, passwordData, passwordError,
    openEdit, closeEdit, handleDraftChange, handlePasswordChange,
    handleImageChange, triggerFileInput, handleSave,
  };
};
