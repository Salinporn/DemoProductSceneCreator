const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ProductData {
  id: number;
  name: string;
  description: string;
  digital_price: string;
  physical_price: string;
  category: string;
  type: string;
  image: string;
  stock: number;
  reviews: number[];
  rating: number;
  model_id: number;
  display_scenes_ids: number[];
}

export async function fetchProductData(productId: number): Promise<ProductData | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/get_product_detail/${productId}/`,
      {
        method: 'GET',
        credentials: 'include', // Important: send cookies
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch product data:', response.status);
      return null;
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product data:', error);
    return null;
  }
}

export async function fetchProductModel(modelId: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/get_3d_model/${modelId}/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch 3D model:', response.status);
      return null;
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return `data:model/gltf-binary;base64,${base64}`;
  } catch (error) {
    console.error('Error fetching 3D model:', error);
    return null;
  }
}

export async function fetchDisplayScene(sceneId: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/get_display_scene/${sceneId}/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch display scene:', response.status);
      return null;
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return `data:model/gltf-binary;base64,${base64}`;
  } catch (error) {
    console.error('Error fetching display scene:', error);
    return null;
  }
}

export async function fetchTextures(modelId: number): Promise<any[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/get_textures/${modelId}/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch textures:', response.status);
      return [];
    }

    const data = await response.json();
    return data.textures || [];
  } catch (error) {
    console.error('Error fetching textures:', error);
    return [];
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/categories/`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get all available scenes for a product
export async function fetchAllDisplayScenes(sceneIds: number[]): Promise<string[]> {
  const scenes: string[] = [];
  
  for (const sceneId of sceneIds) {
    const scene = await fetchDisplayScene(sceneId);
    if (scene) {
      scenes.push(scene);
    }
  }
  
  return scenes;
}