import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../../../styles/ProductManagement.css';

// Supabase configuration
const supabase = createClient(
  "https://dtborzpwbucajcjvjmml.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ym9yenB3YnVjYWpjanZqbW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjExNzksImV4cCI6MjA3MjA5NzE3OX0.MI1LmvWeuojkGEAtIl4atJQoLIgWu34ho-TNmPVUHio"
);

const ProductForm = ({ formState, setFormState, onSubmit, onClose, title, submitText }) => {
  const [selectedSizes, setSelectedSizes] = useState(formState?.availableSizes || []);
  const [sizesInput, setSizesInput] = useState(formState?.size?.join(',') || '');
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(formState?.images?.[0] || '');
  const [backImagePreview, setBackImagePreview] = useState(formState?.images?.[1] || '');
  const [uploading, setUploading] = useState(false);

  if (!formState) return null;

  const handleSizeToggle = (size) => {
    const updatedSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(updatedSizes);
    setFormState({ ...formState, availableSizes: updatedSizes });
  };

  const handleFrontImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024) {
        alert('Image size must be less than 300KB');
        e.target.value = null;
        return;
      }
      setFrontImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300 * 1024) {
        alert('Image size must be less than 300KB');
        e.target.value = null;
        return;
      }
      setBackImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToSupabase = async (file, type) => {
    if (!file) return null;

    const fileName = `${type}-${Date.now()}-${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from("Images")
        .upload(fileName, file);

      if (error) {
        console.error(`Error uploading ${type} image:`, error.message);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("Images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      return null;
    }
  };

  const handleSizesChange = (e) => {
    setSizesInput(e.target.value);
    setFormState({
      ...formState,
      size: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least one image is present (either new file or existing preview)
    const hasFrontImage = frontImageFile || (frontImagePreview && frontImagePreview.startsWith('http'));
    const hasBackImage = backImageFile || (backImagePreview && backImagePreview.startsWith('http'));

    if (!hasFrontImage) {
      alert('Front image is mandatory');
      return;
    }

    if (!formState.description || formState.description.trim() === '') {
      alert('Description is mandatory');
      return;
    }

    if (!sizesInput || sizesInput.trim() === '') {
      alert('At least one size is mandatory');
      return;
    }

    setUploading(true);

    try {
      const imageUrls = [];

      // Upload front image if selected
      if (frontImageFile) {
        const frontUrl = await uploadImageToSupabase(frontImageFile, 'front');
        if (frontUrl) {
          imageUrls.push(frontUrl);
        } else {
          alert('Failed to upload front image');
          setUploading(false);
          return;
        }
      } else if (frontImagePreview && frontImagePreview.startsWith('http')) {
        // Keep existing URL if no new image
        imageUrls.push(frontImagePreview);
      }

      // Upload back image if selected
      if (backImageFile) {
        const backUrl = await uploadImageToSupabase(backImageFile, 'back');
        if (backUrl) {
          imageUrls.push(backUrl);
        }
      } else if (backImagePreview && backImagePreview.startsWith('http')) {
        // Keep existing URL if no new image
        if (imageUrls.length > 0) {
          imageUrls.push(backImagePreview);
        }
      }

      // Prepare product data with Supabase URLs
      const productData = {
        ...formState,
        availableSizes: selectedSizes,
        size: sizesInput.split(',').map(s => s.trim()).filter(Boolean),
        images: imageUrls.length > 0 ? imageUrls : undefined
      };

      onSubmit(productData);
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Failed to add product');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="product-form-container">
      <form onSubmit={handleSubmit}>
        <h3 className="card-title">{title}</h3>

        {/* Basic Product Info */}
        <div className="form-group">
          <label className="form-label">Product Name <span style={{ color: 'red' }}>*</span></label>
          <input
            className="form-input"
            type="text"
            value={formState.name || ''}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price <span style={{ color: 'red' }}>*</span></label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={formState.price || ''}
              onChange={e => setFormState({ ...formState, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Stock <span style={{ color: 'red' }}>*</span></label>
            <input
              className="form-input"
              type="number"
              value={formState.stockQuantity ?? formState.stock ?? ''}
              onChange={e => setFormState({ ...formState, stockQuantity: Number(e.target.value), stock: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Category <span style={{ color: 'red' }}>*</span></label>
          <input
            className="form-input"
            type="text"
            value={formState.category || ''}
            onChange={e => setFormState({ ...formState, category: e.target.value })}
            placeholder="e.g. T-Shirts, Hoodies, Accessories"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Brand</label>
          <input
            className="form-input"
            type="text"
            value={formState.brand || ''}
            onChange={e => setFormState({ ...formState, brand: e.target.value })}
            placeholder="e.g. Nike, Adidas, Puma"
          />
        </div>
        {/* Size Selection */}
        <div className="form-group">
          <label className="form-label">Available Sizes (comma separated) <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            value={sizesInput}
            onChange={handleSizesChange}
            placeholder="e.g. S,M,L,XL"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description <span style={{ color: 'red' }}>*</span></label>
          <textarea
            className="form-textarea"
            value={formState.description || ''}
            onChange={e => setFormState({ ...formState, description: e.target.value })}
            rows="4"
            required
          />
        </div>
        {/* Material & Care Section */}
        <div className="form-group">
          <label className="form-label">Material</label>
          <input
            className="form-input"
            type="text"
            value={formState.material || '100% Cotton'}
            onChange={e => setFormState({ ...formState, material: e.target.value })}
            placeholder="e.g. 100% Cotton, Polyester Blend"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Care Instructions</label>
          <input
            className="form-input"
            type="text"
            value={formState.care || 'Machine Wash'}
            onChange={e => setFormState({ ...formState, care: e.target.value })}
            placeholder="e.g. Machine Wash, Hand Wash Only"
          />
        </div>

        {/* Product Image Upload - Front */}
        <div className="form-group">
          <label className="form-label">Product Image (Front) <span style={{ color: 'red' }}>*</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFrontImageChange}
            className="form-input"
          />
          {frontImagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={frontImagePreview}
                alt="Front Preview"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
              />
            </div>
          )}
        </div>

        {/* Product Image Upload - Back */}
        <div className="form-group">
          <label className="form-label">Product Image (Back) - Upload to Supabase</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackImageChange}
            className="form-input"
          />
          {backImagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={backImagePreview}
                alt="Back Preview"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading to Supabase...' : (submitText || 'Save')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;