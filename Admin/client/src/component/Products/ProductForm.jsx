import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dtborzpwbucajcjvjmml.supabase.co", // Replace with your Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ym9yenB3YnVjYWpjanZqbW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjExNzksImV4cCI6MjA3MjA5NzE3OX0.MI1LmvWeuojkGEAtIl4atJQoLIgWu34ho-TNmPVUHio" // Replace with your Supabase key
);
//hii
const ProductForm = ({ formState, setFormState, onSubmit, onClose, title, submitText }) => {
  const [imageFile, setImageFile] = useState(null); // For image upload
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert("Please select an image to upload.");
      return null;
    }

    const fileName = `${Date.now()}-${imageFile.name}`;
    const { data, error } = await supabase.storage
      .from("Images") // Replace with your Supabase bucket name
      .upload(fileName, imageFile);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    // Generate public URL for the uploaded image
    const { publicURL } = supabase.storage
      .from("Images")
      .getPublicUrl(fileName);

    return publicURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image to Supabase
      const imageUrl = await handleImageUpload();

      if (!imageUrl) {
        alert("Failed to upload image.");
        setLoading(false);
        return;
      }

      // Add image URL to form state
      const updatedFormState = {
        ...formState,
        images: { front: imageUrl }, // Store Supabase URL in MongoDB
      };

      onSubmit(updatedFormState); // Pass updated form state to parent
    } catch (error) {
      console.error("Error adding product:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product Name"
        value={formState.name}
        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={formState.price}
        onChange={(e) => setFormState({ ...formState, price: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={formState.category}
        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && file.size > 300 * 1024) {
            alert('Image size must be less than 300KB');
            e.target.value = null;
            setImageFile(null);
            return;
          }
          setImageFile(file);
        }}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Uploading..." : submitText}
      </button>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
    </form>
  );
};

export default ProductForm;
