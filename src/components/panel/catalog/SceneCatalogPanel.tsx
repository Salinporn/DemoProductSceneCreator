import * as React from "react";
import { Text } from "@react-three/drei";
import { RoundedPlane, GradientBackground, CardBackground } from "../common/PanelElements";

export interface SceneEntry {
  id: number | string;
  label: string;
  type: "display_scene" | "digital_home";
  homeId?: number;
}

interface VRSceneCatalogPanelProps {
  show: boolean;
  scenes: SceneEntry[];
  loading: boolean;
  currentSceneId: number | string | null;
  onSelectScene: (scene: SceneEntry) => void;
  onClose: () => void;
}

export function VRSceneCatalogPanel({
  show,
  scenes,
  loading,
  currentSceneId,
  onSelectScene,
  onClose,
}: VRSceneCatalogPanelProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  if (!show) return null;

  const itemsPerRow = 3;

  const displayScenes = scenes.filter((s) => s.type === "display_scene");
  const digitalHomes = scenes.filter((s) => s.type === "digital_home");

  const displayRows = Math.ceil(displayScenes.length / itemsPerRow);
  const homeRows = Math.ceil(digitalHomes.length / itemsPerRow);

  const headerHeight = 0.24;
  const sectionLabelHeight = 0.04;
  const itemHeight = 0.22;
  const topPadding = 0.02;
  const bottomPadding = 0.04;
  const sectionGap = 0.02;

  const displaySectionHeight = displayScenes.length > 0
    ? sectionLabelHeight + displayRows * itemHeight
    : 0;
  const homeSectionHeight = digitalHomes.length > 0
    ? sectionLabelHeight + homeRows * itemHeight
    : 0;
  const totalContentHeight =
    displaySectionHeight +
    (displayScenes.length > 0 && digitalHomes.length > 0 ? sectionGap : 0) +
    homeSectionHeight;

  const panelHeight = Math.max(
    0.7,
    headerHeight + topPadding + totalContentHeight + bottomPadding
  );
  const panelWidth = 1.05;

  const cardWidth = 0.28;
  const cardHeight = 0.13;
  const cardSpacing = 0.06;
  const totalWidth = itemsPerRow * cardWidth + (itemsPerRow - 1) * cardSpacing;

  function getCardX(col: number) {
    return -totalWidth / 2 + col * (cardWidth + cardSpacing) + cardWidth / 2;
  }

  const contentStartY = panelHeight / 2 - headerHeight - topPadding;
  let cursorY = contentStartY;

  const displayLabelY = cursorY - 0.015;
  cursorY -= sectionLabelHeight;
  const displayCardsTopY = cursorY;
  cursorY -= displayRows * itemHeight;

  if (displayScenes.length > 0 && digitalHomes.length > 0) {
    cursorY -= sectionGap;
  }

  const homeLabelY = cursorY - 0.015;
  cursorY -= sectionLabelHeight;
  const homeCardsTopY = cursorY;

  function renderCard(scene: SceneEntry, cardKey: string, x: number, y: number, isHome: boolean) {
    const isHovered = hoveredItem === cardKey;
    const isActive = String(currentSceneId) === String(scene.id);

    const activeTop    = isHome ? "#10B981" : "#3FA4CE";
    const activeBot    = isHome ? "#34D399" : "#66B9E2";
    const hoverTop     = isHome ? "#D1FAE5" : "#C7E4FA";
    const hoverBot     = isHome ? "#EEF8F3" : "#E6F0F7";
    const defaultTop   = isHome ? "#E6F9F0" : "#DCEEFB";
    const defaultBot   = isHome ? "#F0FAF5" : "#F0F2F5";
    const activeBorder = isHome ? "#10B981" : "#3FA4CE";
    const activeLbl    = isHome ? "#065F46" : "#1E40AF";

    return (
      <group key={cardKey} position={[x, y, 0.015]}>
        <mesh
          onPointerEnter={(e) => { e.stopPropagation(); setHoveredItem(cardKey); }}
          onPointerLeave={(e) => { e.stopPropagation(); setHoveredItem(null); }}
          onPointerDown={(e) => { e.stopPropagation(); onSelectScene(scene); }}
        >
          <CardBackground
            width={cardWidth}
            height={cardHeight}
            radius={0.025}
            colorTop={isActive ? activeTop : isHovered ? hoverTop : defaultTop}
            colorBottom={isActive ? activeBot : isHovered ? hoverBot : defaultBot}
            opacity={isActive ? 0.7 : 0.55}
            topStrength={isActive ? 2.5 : isHovered ? 2.6 : 2.2}
          />
        </mesh>

        {/* Shadow */}
        <mesh position={[0, -0.006, -0.008]}>
          <RoundedPlane width={cardWidth} height={cardHeight} radius={0.025} />
          <meshStandardMaterial color="#000" opacity={0.08} transparent roughness={1} />
        </mesh>

        {/* Active border */}
        {isActive && (
          <mesh position={[0, 0, 0.003]}>
            <RoundedPlane width={cardWidth + 0.007} height={cardHeight + 0.007} radius={0.027} />
            <meshBasicMaterial color={activeBorder} transparent opacity={0.55} />
          </mesh>
        )}

        {/* Icon: */}
        <Text
          position={[-cardWidth / 2 + 0.035, 0.015, 0.01]}
          fontSize={0.035}
          color="#334155"
          anchorX="left"
          anchorY="middle"
        >
          {isHome ? "\u{1F3E0}" : "\u{1F3D9}"}
        </Text>

        {/* Label */}
        <Text
          position={[-cardWidth / 2 + 0.1, 0.012, 0.01]}
          fontSize={0.028}
          color={isActive ? activeLbl : "#334155"}
          anchorX="left"
          anchorY="middle"
          fontWeight={isActive ? "600" : "500"}
          maxWidth={cardWidth - 0.1}
        >
          {scene.label}
        </Text>

        {isActive && (
          <group position={[cardWidth / 2 - 0.13, -0.03, 0.02]}>
            <mesh>
              <planeGeometry args={[0.075, 0.035]} />
              <meshStandardMaterial color="#059669" roughness={0.4} />
            </mesh>
            <Text position={[0, 0, 0.003]} fontSize={0.018} color="#fff" anchorX="center" anchorY="middle" fontWeight="600">
              Active
            </Text>
          </group>
        )}
      </group>
    );
  }

  return (
    <group>
      {/* Background */}
      <mesh position={[0, 0, -0.02]}>
        <GradientBackground
          width={panelWidth}
          height={panelHeight}
          radius={0.08}
          color1="#F0F7FF"
          color2="#F5F7FA"
          opacity={0.75}
        />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, -0.01, -0.03]}>
        <RoundedPlane width={panelWidth} height={panelHeight} radius={0.08} />
        <meshStandardMaterial color="#000000" opacity={0.12} transparent roughness={1.0} />
      </mesh>

      {/* Header */}
      <Text
        position={[0, panelHeight / 2 - 0.1, 0.01]}
        fontSize={0.045}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        fontWeight="semi-bold"
      >
        {"\u{1F3E8}"} Select Scene
      </Text>

      {/* Close button */}
      <group
        position={[panelWidth / 2 - 0.08, panelHeight / 2 - 0.1, 0.01]}
        onPointerEnter={(e) => { e.stopPropagation(); setHoveredButton("close"); }}
        onPointerLeave={(e) => { e.stopPropagation(); setHoveredButton(null); }}
        onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
      >
        <mesh>
          <RoundedPlane width={0.07} height={0.07} radius={0.025} />
          <meshStandardMaterial
            color={hoveredButton === "close" ? "#475569" : "#334155"}
            emissive="#aaa"
            emissiveIntensity={hoveredButton === "close" ? 0.5 : 0.3}
          />
        </mesh>
        <Text position={[0, -0.005, 0.01]} fontSize={0.04} color="#fff" anchorX="center" anchorY="middle">
          {"\u2715"}
        </Text>
      </group>

      {/* Separator under header */}
      <mesh position={[0, panelHeight / 2 - 0.2, 0.01]}>
        <planeGeometry args={[panelWidth - 0.12, 0.004]} />
        <meshBasicMaterial color="#A5D1E7" />
      </mesh>

      {/* Content */}
      {loading ? (
        <Text position={[0, 0, 0.01]} fontSize={0.03} color="#334155" anchorX="center" anchorY="middle">
          Loading scenes...
        </Text>
      ) : scenes.length === 0 ? (
        <Text position={[0, 0, 0.01]} fontSize={0.03} color="#64748B" anchorX="center" anchorY="middle">
          No scenes available
        </Text>
      ) : (
        <group>
          {/* --- DEFAULT SCENES --- */}
          {displayScenes.length > 0 && (
            <>
              <Text
                position={[-(panelWidth / 2) + 0.08, displayLabelY, 0.01]}
                fontSize={0.022}
                color="#64748B"
                anchorX="left"
                anchorY="middle"
                fontWeight="600"
              >
                DEFAULT ROOMS
              </Text>
              {displayScenes.map((scene, idx) => {
                const col = idx % itemsPerRow;
                const row = Math.floor(idx / itemsPerRow);
                return renderCard(
                  scene,
                  `default-room-${scene.id}`,
                  getCardX(col),
                  displayCardsTopY - row * itemHeight - cardHeight / 2,
                  false
                );
              })}
            </>
          )}

          {/* --- DIGITAL HOMES --- */}
          {digitalHomes.length > 0 && (
            <>
              <Text
                position={[-(panelWidth / 2) + 0.08, homeLabelY, 0.01]}
                fontSize={0.022}
                color="#64748B"
                anchorX="left"
                anchorY="middle"
                fontWeight="600"
              >
                MY DIGITAL HOMES
              </Text>
              {digitalHomes.map((scene, idx) => {
                const col = idx % itemsPerRow;
                const row = Math.floor(idx / itemsPerRow);
                return renderCard(
                  scene,
                  `home-${scene.homeId ?? scene.id}`,
                  getCardX(col),
                  homeCardsTopY - row * itemHeight - cardHeight / 2,
                  true
                );
              })}
            </>
          )}
        </group>
      )}
    </group>
  );
}