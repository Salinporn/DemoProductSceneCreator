const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });
}

export async function fetchProductData(productId: string) {
  try {
    const response = await makeAuthenticatedRequest(
      `/products/get_product_detail/${productId}/`
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

export async function fetch3DModel(modelId: number) {
  try {
    const response = await makeAuthenticatedRequest(
      `/products/get_3d_model/${modelId}/`
    );

    if (!response.ok) {
      console.error('Failed to fetch 3D model:', response.status);
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching 3D model:', error);
    return null;
  }
}

export async function fetchDisplayScene(sceneId: string) {
  try {
    const response = await makeAuthenticatedRequest(
      `/products/get_display_scene/${sceneId}/`
    );

    if (!response.ok) {
      console.error('Failed to fetch display scene:', response.status);
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching display scene:', error);
    return null;
  }
}