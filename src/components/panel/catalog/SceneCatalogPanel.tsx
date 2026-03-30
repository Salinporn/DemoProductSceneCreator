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
  defaultRooms: SceneEntry[];
  scenes: SceneEntry[];
  loading: boolean;
  currentSceneId: number | string | null;
  onSelectScene: (scene: SceneEntry) => void;
  onClose: () => void;
}

const ITEMS_PER_ROW = 3;
const ROWS_PER_PAGE = 3;

export function VRSceneCatalogPanel({
  show,
  defaultRooms,
  scenes,
  loading,
  currentSceneId,
  onSelectScene,
  onClose,
}: VRSceneCatalogPanelProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);
  const [defaultPage, setDefaultPage] = React.useState(0);
  const [homePage, setHomePage] = React.useState(0);
  const [pagerHover, setPagerHover] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (show) {
      setDefaultPage(0);
      setHomePage(0);
    }
  }, [show]);

  React.useEffect(() => {
    const homes = scenes.filter((s) => s.type === "digital_home");
    const both = defaultRooms.length > 0 && homes.length > 0;
    const defRows = both ? 1 : ROWS_PER_PAGE;
    const ipp = ITEMS_PER_ROW * defRows;
    const tp = Math.max(1, Math.ceil(defaultRooms.length / ipp));
    setDefaultPage((p) => Math.min(p, tp - 1));
  }, [defaultRooms.length, scenes]);

  React.useEffect(() => {
    const homes = scenes.filter((s) => s.type === "digital_home");
    const homeRows = defaultRooms.length === 0 ? 4 : 3;
    const ipp = ITEMS_PER_ROW * homeRows;
    const tpH = Math.max(1, Math.ceil(homes.length / ipp));
    setHomePage((p) => Math.min(p, tpH - 1));
  }, [scenes, defaultRooms.length]);

  if (!show) return null;

  const otherDisplayScenes = scenes.filter((s) => s.type === "display_scene");
  const digitalHomes = scenes.filter((s) => s.type === "digital_home");

  const bothSections = defaultRooms.length > 0 && digitalHomes.length > 0;
  const defaultRowsPerPage = bothSections ? 1 : ROWS_PER_PAGE;
  const homeRowsPerPage = defaultRooms.length === 0 ? 4 : 3;
  const defaultItemsPerPage = ITEMS_PER_ROW * defaultRowsPerPage;
  const homeItemsPerPage = ITEMS_PER_ROW * homeRowsPerPage;

  const sectionLabelHeight = 0.02;
  const itemHeight = 0.19;
  const pagerHeight = 0.07;
  const topPadding = 0.01;
  const headerHeight = 0.24;
  const sectionGap = 0.02;

  const panelHeight = bothSections ? 1.2 : 1.15;
  const panelWidth = 1.05;

  const cardWidth = 0.28;
  const cardHeight = 0.13;
  const cardSpacing = 0.06;
  const totalWidth = ITEMS_PER_ROW * cardWidth + (ITEMS_PER_ROW - 1) * cardSpacing;

  function getCardX(col: number) {
    return -totalWidth / 2 + col * (cardWidth + cardSpacing) + cardWidth / 2;
  }

  const defTotalPages = Math.max(1, Math.ceil(defaultRooms.length / defaultItemsPerPage));
  const safeDefPage = Math.min(defaultPage, defTotalPages - 1);
  const defaultPageSlice = defaultRooms.slice(
    safeDefPage * defaultItemsPerPage,
    safeDefPage * defaultItemsPerPage + defaultItemsPerPage,
  );

  const homeTotalPages = Math.max(1, Math.ceil(digitalHomes.length / homeItemsPerPage));
  const safeHomePage = Math.min(homePage, homeTotalPages - 1);
  const homePageSlice = digitalHomes.slice(
    safeHomePage * homeItemsPerPage,
    safeHomePage * homeItemsPerPage + homeItemsPerPage,
  );

  const contentStartY = panelHeight / 2 - headerHeight - topPadding;
  let y = contentStartY;

  let defaultLabelY = 0;
  let defaultCardsTopY = 0;
  if (defaultRooms.length > 0) {
    defaultLabelY = y - 0.015;
    y -= sectionLabelHeight;
    defaultCardsTopY = y;
    y -= defaultRowsPerPage * itemHeight;
    if (defTotalPages > 1) y -= pagerHeight;
  }

  if (defaultRooms.length > 0 && digitalHomes.length > 0) {
    y -= sectionGap ;
   }

  let homeLabelY = 0;
  let homeCardsTopY = 0;
  if (digitalHomes.length > 0) {
    homeLabelY = y - 0.015;
    y -= sectionLabelHeight;
    homeCardsTopY = y;
    y -= homeRowsPerPage * itemHeight;
    if (homeTotalPages > 1) y -= pagerHeight;
  }

  function renderCard(
    scene: SceneEntry,
    cardKey: string,
    x: number,
    y: number,
    isHome: boolean,
  ) {
    const isHovered = hoveredItem === cardKey;
    const isActive = String(currentSceneId) === String(scene.id);

    const activeTop = isHome ? "#10B981" : "#3FA4CE";
    const activeBot = isHome ? "#34D399" : "#66B9E2";
    const hoverTop = isHome ? "#D1FAE5" : "#C7E4FA";
    const hoverBot = isHome ? "#EEF8F3" : "#E6F0F7";
    const defaultTop = isHome ? "#E6F9F0" : "#DCEEFB";
    const defaultBot = isHome ? "#F0FAF5" : "#F0F2F5";
    const activeBorder = isHome ? "#80e8c5" : "#7abfe2";
    const activeLbl = isHome ? "#065F46" : "#ffffff";

    return (
      <group key={cardKey} position={[x, y, 0.015]}>
        <mesh
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHoveredItem(cardKey);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setHoveredItem(null);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelectScene(scene);
          }}
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

        <mesh position={[0, -0.006, -0.008]}>
          <RoundedPlane width={cardWidth} height={cardHeight} radius={0.025} />
          <meshStandardMaterial color="#000" opacity={0.08} transparent roughness={1} />
        </mesh>

        {isActive && (
          <mesh position={[0, 0, 0.003]}>
            <RoundedPlane width={cardWidth + 0.007} height={cardHeight + 0.007} radius={0.027} />
            <meshBasicMaterial color={activeBorder} transparent opacity={0.55} />
          </mesh>
        )}

        <Text
          position={[-cardWidth / 2 + 0.026, 0, 0.01]}
          fontSize={0.035}
          color="#334155"
          anchorX="left"
          anchorY="middle"
        >
          {isHome ? "\u{1F3E0}" : "\u{1F3D9}"}
        </Text>
        <Text
          position={[-cardWidth / 2 + 0.09, 0, 0.01]}
          fontSize={0.026}
          color={isActive ? activeLbl : "#334155"}
          anchorX="left"
          anchorY="middle"
          fontWeight={isActive ? "600" : "500"}
          maxWidth={cardWidth - 0.11}
          overflowWrap="break-word"
          textAlign="left"
        >
          {scene.label}
        </Text>

     
      </group>
    );
  }

  function renderSectionPager(
    sectionId: string,
    safePage: number,
    totalPages: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    centerY: number,
  ) {
    if (totalPages <= 1) return null;
    const prevId = `${sectionId}-prev`;
    const nextId = `${sectionId}-next`;
    return (
      <group position={[0, centerY+0.01, 0.02]}>
        <group
          position={[-0.28, 0, 0]}
          onPointerEnter={(e) => {
            e.stopPropagation();
            if (safePage > 0) setPagerHover(prevId);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setPagerHover(null);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (safePage > 0) setPage((p) => Math.max(0, p - 1));
          }}
        >
          <mesh>
            <RoundedPlane width={0.11} height={0.055} radius={0.015} />
            <meshStandardMaterial
              color={
                safePage === 0
                  ? "#ffffff"
                  : pagerHover === prevId
                    ? "#475569"
                    : "#334155"
              }
              roughness={0.5}
            />
          </mesh>
          <Text
            position={[0, 0.005, 0.01]}
            fontSize={0.022}
            color={safePage === 0 ? "#295061" : "#fff"}
            anchorX="center"
            anchorY="middle"
            fontWeight="600"
          >
            Prev
          </Text>
        </group>

        <Text
          position={[0, 0.005, 0.01]}
          fontSize={0.022}
          color="#475569"
          anchorX="center"
          anchorY="middle"
        >
          {`${safePage + 1} / ${totalPages}`}
        </Text>

        <group
          position={[0.28, 0, 0]}
          onPointerEnter={(e) => {
            e.stopPropagation();
            if (safePage < totalPages - 1) setPagerHover(nextId);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setPagerHover(null);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (safePage < totalPages - 1) {
              setPage((p) => Math.min(totalPages - 1, p + 1));
            }
          }}
        >
          <mesh>
            <RoundedPlane width={0.11} height={0.055} radius={0.015} />
            <meshStandardMaterial
              color={
                safePage >= totalPages - 1
                  ? "#ffffff"
                  : pagerHover === nextId
                    ? "#475569"
                    : "#334155"
              }
              roughness={0.5}
            />
          </mesh>
          <Text
            position={[0, 0.005, 0.01]}
            fontSize={0.022}
            color={safePage >= totalPages - 1 ? "#295061" : "#fff"}
            anchorX="center"
            anchorY="middle"
            fontWeight="600"
          >
            Next
          </Text>
        </group>
      </group>
    );
  }

  function renderPaginatedSection(
    label: string,
    list: SceneEntry[],
    pageSlice: SceneEntry[],
    safePage: number,
    totalPages: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    cardsTopY: number,
    labelY: number,
    keyPrefix: string,
    isHome: boolean,
    sectionId: string,
    sectionRowsPerPage: number,
  ) {
    if (list.length === 0) return null;
    const pagerY =
      cardsTopY - sectionRowsPerPage * itemHeight - pagerHeight * 0.45;
    return (
      <>
        <Text
          position={[-(panelWidth / 2) + 0.08, labelY+0.03, 0.01]}
          fontSize={0.024}
          color="#64748B"
          anchorX="left"
          anchorY="middle"
          fontWeight="600"
        >
          {label}
        </Text>
        {pageSlice.map((scene, idx) => {
          const col = idx % ITEMS_PER_ROW;
          const row = Math.floor(idx / ITEMS_PER_ROW);
          return renderCard(
            scene,
            `${keyPrefix}-${scene.id}-p${safePage}-${idx}`,
            getCardX(col),
            cardsTopY - row * itemHeight - cardHeight / 2,
            isHome,
          );
        })}
        {renderSectionPager(sectionId, safePage, totalPages, setPage, pagerY)}
      </>
    );
  }

  const hasAny =
    defaultRooms.length > 0 || otherDisplayScenes.length > 0 || digitalHomes.length > 0;

  return (
    <group>
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

      <mesh position={[0, -0.01, -0.03]}>
        <RoundedPlane width={panelWidth} height={panelHeight} radius={0.08} />
        <meshStandardMaterial color="#000000" opacity={0.12} transparent roughness={1.0} />
      </mesh>

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

      <group
        position={[panelWidth / 2 - 0.08, panelHeight / 2 - 0.1, 0.01]}
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

      <mesh position={[0, panelHeight / 2 - 0.18, 0.01]}>
        <planeGeometry args={[panelWidth - 0.12, 0.004]} />
        <meshBasicMaterial color="#A5D1E7" />
      </mesh>

      {loading ? (
        <Text position={[0, 0, 0.01]} fontSize={0.03} color="#334155" anchorX="center" anchorY="middle">
          Loading scenes...
        </Text>
      ) : !hasAny ? (
        <Text position={[0, 0, 0.01]} fontSize={0.03} color="#64748B" anchorX="center" anchorY="middle">
          No scenes available
        </Text>
      ) : (
        <group>
          {renderPaginatedSection(
            "DEFAULT ROOMS",
            defaultRooms,
            defaultPageSlice,
            safeDefPage,
            defTotalPages,
            setDefaultPage,
            defaultCardsTopY,
            defaultLabelY,
            "default-room",
            false,
            "def",
            defaultRowsPerPage,
          )}
          {renderPaginatedSection(
            "MY DIGITAL HOMES",
            digitalHomes,
            homePageSlice,
            safeHomePage,
            homeTotalPages,
            setHomePage,
            homeCardsTopY,
            homeLabelY,
            "home",
            true,
            "home",
            homeRowsPerPage,
          )}
        </group>
      )}
    </group>
  );
}
