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
  quantity: number;
  cart_item_id: number;
}

interface VRCartCatalogPanelProps {
  show: boolean;
  products: CartProduct[];
  loading: boolean;
  placedInSceneCartUnitKeys: string[];
  currentSceneId: string | number | null;
  currentSceneType: "display_scene" | "digital_home" | null;
  onSelectProduct: (product: CartProduct, cartUnitKey: string) => void;
  onClose: () => void;
}

export function VRCartCatalogPanel({
  show,
  products,
  loading,
  placedInSceneCartUnitKeys,
  currentSceneId,
  currentSceneType,
  onSelectProduct,
  onClose,
}: VRCartCatalogPanelProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);

  const itemsPerRow = 3;
  const rowsPerPage = 2;
  const itemsPerPage = itemsPerRow * rowsPerPage;

  React.useEffect(() => {
    if (show) setPageIndex(0);
  }, [show]);

  const cartUnitSlots = React.useMemo(
    () =>
      products.flatMap((p) =>
        Array.from({ length: Math.max(0, Math.floor(p.quantity)) }, (_, unitIndex) => ({
          line: p,
          unitIndex,
        })),
      ),
    [products],
  );

  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(cartUnitSlots.length / itemsPerPage));
    setPageIndex((p) => Math.min(p, totalPages - 1));
  }, [cartUnitSlots.length, itemsPerPage]);

  const placedSet = React.useMemo(
    () => new Set(placedInSceneCartUnitKeys),
    [placedInSceneCartUnitKeys],
  );

  if (!show) return null;

  const canViewInCurrentScene = (product: CartProduct): boolean => {
    if (currentSceneType === "digital_home") return true;
    
    if (currentSceneType === "display_scene" && currentSceneId) {
      const sceneId = Number(currentSceneId);
      return (product.display_scenes_ids || []).includes(sceneId);
    }
    
    return true;
  };

  const inDisplayScene = currentSceneType === "display_scene";
  const headerHeight = inDisplayScene ? 0.34 : 0.25;
  const itemHeight = 0.46;
  const topPadding = -0.06;
  const bottomPadding = 0.06;
  const pagerHeight = 0.1;

  const panelHeight =
    headerHeight +
    topPadding +
    rowsPerPage * itemHeight +
    pagerHeight;
  const panelWidth = 1;

  const totalPages = Math.max(1, Math.ceil(cartUnitSlots.length / itemsPerPage));
  const safePage = Math.min(pageIndex, totalPages - 1);
  const pageSlots = cartUnitSlots.slice(
    safePage * itemsPerPage,
    safePage * itemsPerPage + itemsPerPage,
  );

  return (
    <group>
      {/* Main background */}
      <mesh position={[0, 0, -0.02]}>
        <GradientBackground
          width={panelWidth}
          height={panelHeight}
          radius={0.1}
          color1="#EAF4FA"
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
        🛒 Cart Items
      </Text>

      {inDisplayScene && (
        <Text
          position={[0, panelHeight / 2 - 0.2, 0.01]}
          fontSize={0.022}
          color="#DC2626"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.9}
          textAlign="center"
        >
          ⚠️ Only products with this room can be viewed here
        </Text>
      )}

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
            Loading cart...
          </Text>
        </group>
      ) : cartUnitSlots.length === 0 ? (
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
          {pageSlots.map(({ line: product, unitIndex }, itemIndex) => {
            const col = itemIndex % itemsPerRow;
            const row = Math.floor(itemIndex / itemsPerRow);

            const cardWidth = 0.25;
            const cardHeight = 0.4;
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

            const hoverKey = `${product.cart_item_id}-u${unitIndex}`;
            const isHovered = hoveredItem === hoverKey;
            const isPlacedInScene = placedSet.has(hoverKey);
            const isCompatible = canViewInCurrentScene(product);

            const price =
              product.digital_price && product.digital_price !== "None"
                ? `$${parseFloat(product.digital_price).toFixed(2)}`
                : product.physical_price &&
                    product.physical_price !== "None"
                  ? `$${parseFloat(product.physical_price).toFixed(2)}`
                  : null;

            return (
              <group
                key={`cart-${product.cart_item_id}-u${unitIndex}-p${safePage}`}
                position={[x, y, 0.02]}
              >
                <mesh
                  position={[0, 0, 0]}
                  onPointerEnter={(e) => {
                    e.stopPropagation();
                    if (isCompatible) setHoveredItem(hoverKey);
                  }}
                  onPointerLeave={(e) => {
                    e.stopPropagation();
                    setHoveredItem(null);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (isCompatible) {
                      onSelectProduct(product, hoverKey);
                    }
                  }}
                >
                  <CardBackground
                    width={cardWidth}
                    height={cardHeight}
                    radius={0.04}
                    colorTop={
                      !isCompatible
                        ? "#94A3B8"
                        : isPlacedInScene && isHovered
                          ? "#48b9e8"
                          : isPlacedInScene
                            ? "#99bac8"
                            : isHovered
                              ? "#C7E4FA"
                              : "#DCEEFB"
                    }
                    colorBottom={
                      !isCompatible
                        ? "#CBD5E1"
                        : isPlacedInScene && isHovered
                          ? "#6a7c92"
                          : isPlacedInScene
                            ? "#4a5d73"
                            : isHovered
                              ? "#E6F0F7"
                              : "#F0F2F5"
                    }
                    opacity={
                      !isCompatible ? 0.3 : isPlacedInScene ? 0.68 : 0.5
                    }
                    topStrength={
                      isPlacedInScene ? 2.2 : isHovered ? 2.8 : 2.5
                    }
                  />
                </mesh>

                <mesh position={[0, -0.01, -0.01]}>
                  <RoundedPlane width={cardWidth} height={cardHeight} radius={0.04} />
                  <meshStandardMaterial
                    color="#000000"
                    opacity={0.1}
                    transparent
                    roughness={1.0}
                  />
                </mesh>

                {isPlacedInScene && (
                  <mesh position={[0, 0, 0.005]}>
                    <RoundedPlane width={cardWidth + 0.008} height={cardHeight + 0.008} radius={0.043} />
                    <meshBasicMaterial
                      color="#68c7f7"
                      transparent
                      opacity={0.8}
                    />
                  </mesh>
                )}

                {!isCompatible && (
                  <mesh position={[0, 0, 0.015]}>
                    <RoundedPlane width={cardWidth} height={cardHeight} radius={0.04} />
                    <meshBasicMaterial
                      color="#648dab"
                      transparent
                      opacity={0.5}
                    />
                  </mesh>
                )}

                <group position={[0, 0.08, 0.01]}>
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

                {!isCompatible && (
                  <Text
                    position={[0, 0.1, 0.02]}
                    fontSize={0.08}
                    color="#e3eefb"
                    anchorX="center"
                    anchorY="middle"
                  >
                    🛡
                  </Text>
                )}

                {product.category && isCompatible && (
                  <group position={[-0.05, -0.06, 0.02]}>
                    <mesh>
                      <planeGeometry args={[0.14, 0.045]} />
                      <meshStandardMaterial color="#66B9E2" roughness={0.5} />
                    </mesh>
                    <Text
                      position={[0, 0, 0.003]}
                      fontSize={0.018}
                      color="#000000"
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

                <Text
                  position={[0, -0.12, 0.02]}
                  fontSize={0.028}
                  color={
                    !isCompatible
                      ? "#64748B"
                      : isPlacedInScene
                        ? "#e2e8f0"
                        : "#334155"
                  }
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

                {price && (
                  <Text
                    position={[0, -0.17, 0.02]}
                    fontSize={0.025}
                    color={
                      !isCompatible
                        ? "#64748B"
                        : isPlacedInScene
                          ? "#d1e2ea"
                          : "#0369A1"
                    }
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="600"
                  >
                    {price}
                  </Text>
                )}
              </group>
            );
          })}

          {totalPages > 1 && (
            <group position={[0, -panelHeight / 2 + bottomPadding + pagerHeight * 0.45, 0.02]}>
              <group
                position={[-0.32, 0, 0]}
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  if (safePage > 0) setHoveredButton("prev");
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  setHoveredButton(null);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (safePage > 0) setPageIndex((p) => Math.max(0, p - 1));
                }}
              >
                <mesh>
                  <RoundedPlane width={0.14} height={0.07} radius={0.02} />
                  <meshStandardMaterial
                    color={
                      safePage === 0
                        ? "#CBD5E1"
                        : hoveredButton === "prev"
                          ? "#475569"
                          : "#334155"
                    }
                    roughness={0.5}
                  />
                </mesh>
                <Text
                  position={[0, 0.005, 0.01]}
                  fontSize={0.028}
                  color={safePage === 0 ? "#94A3B8" : "#fff"}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="600"
                >
                  Prev
                </Text>
              </group>

              <Text
                position={[0, -0.008, 0.01]}
                fontSize={0.026}
                color="#475569"
                anchorX="center"
                anchorY="middle"
              >
                {`${safePage + 1} / ${totalPages}`}
              </Text>

              <group
                position={[0.32, 0, 0]}
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  if (safePage < totalPages - 1) setHoveredButton("next");
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  setHoveredButton(null);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (safePage < totalPages - 1) {
                    setPageIndex((p) => Math.min(totalPages - 1, p + 1));
                  }
                }}
              >
                <mesh>
                  <RoundedPlane width={0.14} height={0.07} radius={0.02} />
                  <meshStandardMaterial
                    color={
                      safePage >= totalPages - 1
                        ? "#CBD5E1"
                        : hoveredButton === "next"
                          ? "#475569"
                          : "#334155"
                    }
                    roughness={0.5}
                  />
                </mesh>
                <Text
                  position={[0, 0.005, 0.01]}
                  fontSize={0.028}
                  color={safePage >= totalPages - 1 ? "#94A3B8" : "#fff"}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="600"
                >
                  Next
                </Text>
              </group>
            </group>
          )}
        </group>
      )}
    </group>
  );
}