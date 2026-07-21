import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HiPhotograph, HiUpload, HiTrash, HiTag, HiEye,
  HiCloudUpload, HiSearch,
} from 'react-icons/hi';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Lightbox from '@/components/ui/Lightbox';
import toast from 'react-hot-toast';
import { galleryAPI } from '@/api/client';

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', event_tag: '' });
  const fileInputRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await galleryAPI.getAll({ limit: 100 });
      const data = res.data || res.images || [];
      setImages(Array.isArray(data) ? data : []);
    } catch { setImages([]); }
    finally { setLoading(false); }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true); else if (e.type === 'dragleave') setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) { setUploadFiles(files); setShowUploadModal(true); }
    else toast.error('Please drop image files only');
  };
  const handleFileSelect = (e) => { const files = Array.from(e.target.files); if (files.length > 0) { setUploadFiles(files); setShowUploadModal(true); } };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) { toast.error('No files selected'); return; }
    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('image', file);
        if (uploadForm.title) formData.append('title', uploadForm.title);
        if (uploadForm.description) formData.append('description', uploadForm.description);
        await galleryAPI.upload(formData);
      }
      toast.success(`${uploadFiles.length} image${uploadFiles.length > 1 ? 's' : ''} uploaded`);
      setShowUploadModal(false); setUploadFiles([]); setUploadForm({ title: '', description: '', event_tag: '' });
      fetchImages();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await galleryAPI.delete(deleteItem.id);
      toast.success('Image deleted');
      setDeleteItem(null);
      fetchImages();
    } catch { toast.error('Failed to delete'); }
  };

  const filteredImages = images.filter((img) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (img.title || '').toLowerCase().includes(s) || (img.description || '').toLowerCase().includes(s) || (img.event_tag || '').toLowerCase().includes(s);
  });

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Gallery Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload and manage community event photos</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()}><HiUpload className="w-4 h-4 mr-2" /> Upload</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, description, or tag..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
        </div>

        <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragActive ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-800'}`}
          onClick={() => fileInputRef.current?.click()}>
          <HiCloudUpload className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600'}`} />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{dragActive ? 'Drop images here' : 'Drag and drop images here, or click to browse'}</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <EmptyState title="Gallery is empty" description={search ? 'No images match your search.' : 'Upload photos from community events.'} actionLabel={!search ? 'Upload Image' : undefined} onAction={!search ? () => fileInputRef.current?.click() : undefined} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                {item.url ? (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <HiPhotograph className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => setLightboxIndex(i)} className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg" title="Preview"><HiEye className="w-4 h-4" /></button>
                <button onClick={() => setDeleteItem(item)} className="p-2.5 bg-red-500/90 rounded-xl text-white hover:bg-red-600 transition-colors shadow-lg" title="Delete"><HiTrash className="w-4 h-4" /></button>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title || 'Untitled'}</h4>
                {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  {item.event_tag && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800"><HiTag className="w-3 h-3" />{item.event_tag}</span>}
                  {item.created_at && <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setUploadFiles([]); }} title="Upload Images" width="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected</p>
            <div className="flex flex-wrap gap-2">
              {uploadFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                  <HiPhotograph className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                </div>
              ))}
            </div>
          </div>
          <Input label="Title" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="e.g., Community Meetup Photos" />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} placeholder="Brief description..." rows={2}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowUploadModal(false); setUploadFiles([]); }}>Cancel</Button>
            <Button type="submit" loading={uploading}><HiUpload className="w-4 h-4 mr-1.5" />Upload</Button>
          </div>
        </form>
      </Modal>

      <Lightbox images={filteredImages} initialIndex={lightboxIndex || 0} isOpen={lightboxIndex !== null} onClose={() => setLightboxIndex(null)} />

      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Image" width="sm">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"><HiTrash className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete "{deleteItem?.title || 'this image'}"? This action cannot be undone.</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
