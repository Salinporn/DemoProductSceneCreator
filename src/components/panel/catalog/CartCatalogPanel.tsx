import * as React from "react";
import { Text } from "@react-three/drei";
import { FurnitureImage } from "../furniture/FurnitureImage";
import { RoundedPlane, GradientBackground, CardBackground } from "../common/PanelElements";

export interface CartProduct {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  product_type?: string;
  digital_price?: string | null;
  physical_price?: string | null;
  image?: string | null;
  rating?: number;
  display_scenes_ids?: number[];
  model_id?: number;
  quantity?: number;
  cart_item_id?: number;
}

interface VRCartCatalogPanelProps {
  show: boolean;
  products: CartProduct[];
  loading: boolean;
  currentProductId: string | number | null;
  onSelectProduct: (product: CartProduct) => void;
  onClose: () => void;
}

export function VRCartCatalogPanel({
  show,
  products,
  loading,
  currentProductId,
  onSelectProduct,
  onClose,
}: VRCartCatalogPanelProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  if (!show) return null;

  const itemsPerRow = 3;
  const rows = Math.ceil(products.length / itemsPerRow);

  const headerHeight = 0.25;
  const itemHeight = 0.52;
  const topPadding = 0.005;
  const bottomPadding = 0.03;

  const panelHeight = Math.max(
    1.2,
    headerHeight + topPadding + rows * itemHeight + bottomPadding
  );
  const panelWidth = 1.05;

  return (
    <group>
      {/* Main background */}
      <mesh position={[0, 0, -0.02]}>
        <GradientBackground
          width={panelWidth}
          height={panelHeight}
          radius={0.1}
          color1="#F0F7FF"
          color2="#F5F7FA"
          opacity={0.7}
        />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, -0.01, -0.03]}>
        <RoundedPlane width={panelWidth} height={panelHeight} radius={0.1} />
        <meshStandardMaterial
          color="#000000"
          opacity={0.15}
          transparent
          roughness={1.0}
        />
      </mesh>

      {/* Header */}
      <Text
        position={[0, panelHeight / 2 - 0.12, 0.01]}
        fontSize={0.05}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        fontWeight="semi-bold"
      >
        🛒 My Cart Items
      </Text>

      {/* Close Button */}
      <group
        position={[panelWidth / 2 - 0.08, panelHeight / 2 - 0.12, 0.01]}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHoveredButton("close");
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHoveredButton(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <mesh>
          <RoundedPlane width={0.08} height={0.08} radius={0.03} />
          <meshStandardMaterial
            color={hoveredButton === "close" ? "#475569" : "#334155"}
            emissive={hoveredButton === "close" ? "#ccc" : "#ccc"}
            emissiveIntensity={hoveredButton === "close" ? 0.6 : 0.4}
          />
        </mesh>
        <Text
          position={[-0.005, -0.01, 0.01]}
          fontSize={0.05}
          color="#fff"
          anchorX="center"
          anchorY="middle"
        >
          ✕
        </Text>
      </group>

      {/* Content */}
      {loading ? (
        <group position={[0, 0, 0.01]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.03}
            color="#334155"
            anchorX="center"
            anchorY="middle"
          >
            Loading cart items...
          </Text>
        </group>
      ) : products.length === 0 ? (
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.03}
          color="#334155"
          anchorX="center"
          anchorY="middle"
        >
          Your cart is empty
        </Text>
      ) : (
        <group>
          {products.map((product, itemIndex) => {
            const col = itemIndex % itemsPerRow;
            const row = Math.floor(itemIndex / itemsPerRow);

            const cardWidth = 0.27;
            const cardHeight = 0.42;
            const cardSpacing = 0.05;
            const totalWidth =
              itemsPerRow * cardWidth + (itemsPerRow - 1) * cardSpacing;
            const x =
              -totalWidth / 2 +
              col * (cardWidth + cardSpacing) +
              cardWidth / 2;
            const y =
              panelHeight / 2 -
              headerHeight -
              topPadding -
              row * itemHeight -
              cardHeight / 2;

            const itemKey = String(product.id);
            const isHovered = hoveredItem === itemKey;
            const isActive = String(currentProductId) === itemKey;

            const price =
              product.digital_price && product.digital_price !== "None"
                ? `$${parseFloat(product.digital_price).toFixed(2)}`
                : product.physical_price &&
                    product.physical_price !== "None"
                  ? `$${parseFloat(product.physical_price).toFixed(2)}`
                  : null;

            return (
              <group key={`cart-product-${itemKey}-${itemIndex}`} position={[x, y, 0.02]}>
                {/* Card background */}
                <mesh
                  position={[0, 0, 0]}
                  onPointerEnter={(e) => {
                    e.stopPropagation();
                    setHoveredItem(itemKey);
                  }}
                  onPointerLeave={(e) => {
                    e.stopPropagation();
                    setHoveredItem(null);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectProduct(product);
                  }}
                >
                  <CardBackground
                    width={cardWidth}
                    height={cardHeight}
                    radius={0.04}
                    colorTop={
                      isActive
                        ? "#6366F1"
                        : isHovered
                          ? "#C7D2FE"
                          : "#E0E7FF"
                    }
                    colorBottom={
                      isActive
                        ? "#818CF8"
                        : isHovered
                          ? "#E0E7FF"
                          : "#F0F2F5"
                    }
                    opacity={isActive ? 0.65 : 0.5}
                    topStrength={isActive ? 2.8 : isHovered ? 2.8 : 2.5}
                  />
                </mesh>

                {/* Card shadow */}
                <mesh position={[0, -0.01, -0.01]}>
                  <RoundedPlane width={cardWidth} height={cardHeight} radius={0.04} />
                  <meshStandardMaterial
                    color="#000000"
                    opacity={0.1}
                    transparent
                    roughness={1.0}
                  />
                </mesh>

                {/* Active border highlight */}
                {isActive && (
                  <mesh position={[0, 0, 0.005]}>
                    <RoundedPlane width={cardWidth + 0.008} height={cardHeight + 0.008} radius={0.043} />
                    <meshBasicMaterial
                      color="#6366F1"
                      transparent
                      opacity={0.6}
                    />
                  </mesh>
                )}

                {/* Product Image */}
                <group position={[0, 0.1, 0.01]}>
                  {product.image ? (
                    <mesh>
                      <planeGeometry args={[0.2, 0.2]} />
                      <FurnitureImage image={product.image} />
                    </mesh>
                  ) : (
                    <>
                      <mesh>
                        <planeGeometry args={[0.2, 0.2]} />
                        <meshStandardMaterial color="#d0d6dd" />
                      </mesh>
                      <Text
                        position={[0, 0, 0.005]}
                        fontSize={0.025}
                        color="#94A3B8"
                        anchorX="center"
                        anchorY="middle"
                      >
                        No Image
                      </Text>
                    </>
                  )}
                </group>

                {/* Quantity badge */}
                {product.quantity && product.quantity > 1 && (
                  <group position={[0.08, 0.15, 0.02]}>
                    <mesh>
                      <circleGeometry args={[0.025, 16]} />
                      <meshStandardMaterial color="#EF4444" />
                    </mesh>
                    <Text
                      position={[0, 0, 0.003]}
                      fontSize={0.02}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      fontWeight="700"
                    >
                      {product.quantity}
                    </Text>
                  </group>
                )}

                {/* Category badge */}
                {product.category && (
                  <group position={[-0.05, -0.05, 0.02]}>
                    <mesh>
                      <planeGeometry args={[0.14, 0.045]} />
                      <meshStandardMaterial color="#818CF8" roughness={0.5} />
                    </mesh>
                    <Text
                      position={[0, 0, 0.003]}
                      fontSize={0.018}
                      color="#ffffff"
                      anchorX="center"
                      anchorY="middle"
                      fontWeight="600"
                    >
                      {product.category.length > 10
                        ? product.category.slice(0, 9) + "…"
                        : product.category}
                    </Text>
                  </group>
                )}

                {/* Product name */}
                <Text
                  position={[0, -0.12, 0.02]}
                  fontSize={0.028}
                  color="#334155"
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={cardWidth - 0.06}
                  textAlign="center"
                  fontWeight="500"
                >
                  {product.name.length > 16
                    ? product.name.slice(0, 15) + "…"
                    : product.name}
                </Text>

                {/* Price */}
                {price && (
                  <Text
                    position={[0, -0.17, 0.02]}
                    fontSize={0.025}
                    color={isActive ? "#4338CA" : "#6366F1"}
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="600"
                  >
                    {price}
                  </Text>
                )}

                {isActive && (
                  <group position={[0, -0.2, 0.02]}>
                    <Text
                      position={[0, 0, 0]}
                      fontSize={0.02}
                      color="#059669"
                      anchorX="center"
                      anchorY="middle"
                      fontWeight="600"
                    >
                      ✓ Viewing
                    </Text>
                  </group>
                )}
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}