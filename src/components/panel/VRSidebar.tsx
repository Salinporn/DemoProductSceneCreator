import { Text } from "@react-three/drei";
import { GradientBackground, RoundedPlane } from "./common/PanelElements";
import { useState } from "react";
import { useCursor } from "@react-three/drei";

interface SidebarItemData {
  id: string;
  icon: string;
  label: string;
  color: string;
  description: string;
}

const demoSidebarItems: SidebarItemData[] = [
  {
    id: "products",
    icon: "🛋️",
    label: "Products",
    color: "#3FA4CE",
    description: "Browse all store products",
  },
  {
    id: "scenes",
    icon: "🏠",
    label: "Scenes",
    color: "#10B981",
    description: "Switch preview scene",
  },
  {
    id: "instructions",
    icon: "📖",
    label: "Help",
    color: "#8B5CF6",
    description: "Controls & instructions",
  },
];

const SIDEBAR_WIDTH = 0.25;
const SIDEBAR_CENTER_X = SIDEBAR_WIDTH / 10;

interface SidebarItemProps {
  item: SidebarItemData;
  yPos: number;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  isHovered: boolean;
}

function SidebarItem({ item, yPos, isActive, onHover, onClick, isHovered }: SidebarItemProps) {
  useCursor(isHovered, "pointer");

  return (
    <group position={[SIDEBAR_CENTER_X, yPos, 0]}>
      <group
        onPointerEnter={(e) => { e.stopPropagation(); onHover(item.id); }}
        onPointerLeave={(e) => { e.stopPropagation(); onHover(null); }}
        onPointerDown={(e) => { e.stopPropagation(); onClick(item.id); }}
      >
        {/* Button background */}
        <mesh>
          <RoundedPlane width={0.12} height={0.12} radius={0.02} />
          <meshStandardMaterial
            color={isActive ? item.color : isHovered ? "#334155" : "#1E293B"}
            emissive={isHovered ? item.color : "#000000"}
            emissiveIntensity={isHovered ? 0.3 : 0}
          />
        </mesh>

        {/* Icon */}
        <Text
          position={[0.01, 0, 0.01]}
          fontSize={0.055}
          color={isActive || isHovered ? "#000000" : "#94A3B8"}
          anchorX="center"
          anchorY="middle"
        >
          {item.icon}
        </Text>

        {/* Active indicator stripe */}
        {isActive && (
          <mesh position={[0.07, 0, 0.01]}>
            <planeGeometry args={[0.01, 0.12]} />
            <meshBasicMaterial color={item.color} />
          </mesh>
        )}
      </group>

      {/* Tooltip */}
      {isHovered && (
        <group position={[0.15, 0, 0]}>
          <mesh>
            <planeGeometry args={[0.2, 0.06]} />
            <meshBasicMaterial color="#334155" opacity={0.95} transparent />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.025}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            {item.label}
          </Text>
        </group>
      )}
    </group>
  );
}

interface VRDemoSidebarProps {
  show: boolean;
  activePanel: string | null; // "products" | "scenes" | "instructions" | null
  onItemSelect: (itemId: string) => void;
}

export function VRSidebar({ show, activePanel, onItemSelect }: VRDemoSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (!show) return null;

  const handleItemClick = (itemId: string) => {
    onItemSelect(itemId);
  };

  const sidebarHeight = 0.2 + demoSidebarItems.length * 0.22;
  const startY = (demoSidebarItems.length - 1) * 0.11;

  return (
    <group position={[-0.8, 0, 0]}>
      {/* Sidebar background */}
      <mesh position={[0, 0, -0.01]}>
        <GradientBackground
          width={SIDEBAR_WIDTH}
          height={sidebarHeight}
          radius={0.02}
          color1="#1E293B"
          color2="#0F172A"
          opacity={0.85}
        />
      </mesh>

      {/* Items */}
      {demoSidebarItems.map((item, index) => (
        <SidebarItem
          key={item.id}
          item={item}
          yPos={startY - index * 0.22}
          isActive={activePanel === item.id}
          isHovered={hoveredItem === item.id}
          onHover={setHoveredItem}
          onClick={handleItemClick}
        />
      ))}

      {/* Dividers between items */}
      {demoSidebarItems.map((_, index) => {
        if (index === demoSidebarItems.length - 1) return null;
        const yPos = startY - index * 0.22 - 0.11;
        return (
          <mesh key={`div-${index}`} position={[SIDEBAR_CENTER_X, yPos, 0]}>
            <planeGeometry args={[0.1, 0.002]} />
            <meshBasicMaterial color="#334155" opacity={0.5} transparent />
          </mesh>
        );
      })}
    </group>
  );
}