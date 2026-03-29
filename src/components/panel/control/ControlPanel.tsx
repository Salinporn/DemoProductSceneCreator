import * as React from "react";
import { Text } from "@react-three/drei";
import { RoundedPlane, GradientBackground, ButtonBackground } from "../common/PanelElements";

export function VRControlPanel({
  show,
  onHelp,
  onBack,
  onLogout,
  alignmentMode,
  onToggleAlignment,
  showAlignmentToggle = false,
  homeTransparent = false,
  onToggleTransparency,
}: {
  show: boolean;
  onHelp: () => void;
  onBack: () => void;
  onLogout: () => void;
  onClose: () => void;
  alignmentMode?: 'world' | 'free' | null;
  onToggleAlignment?: () => void;
  showAlignmentToggle?: boolean;
  homeTransparent?: boolean;
  onToggleTransparency?: () => void;
}) {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  if (!show) return null;

  const panelWidth = 0.72;
  const panelHeight = 1.05;
  const buttonWidth = 0.57;
  const buttonHeight = 0.1;

  const alignRowShown =
    showAlignmentToggle && !!alignmentMode && !!onToggleAlignment;
  const yBelowHelp = alignRowShown ? 0.04 : 0.18;

  return (
    <group>
      {/* Main background panel */}
      <mesh position={[0, 0, -0.02]}>
        <GradientBackground width={panelWidth} height={panelHeight} radius={0.1} color1="#EAF4FA" color2="#F0F2F5" opacity={0.7} />
      </mesh>

      {/** Background Shadow */}
      <mesh position={[0, 0, -0.03]}>
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
        position={[0, panelHeight / 2 - 0.15, 0.01]}
        fontSize={0.05}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        fontWeight="semi-bold"
      >
        ☰ Control Panel
      </Text>

      {/* Instruction Button */}
      <group position={[0, 0.25, 0.01]}>
        <mesh
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHoveredButton("help");
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setHoveredButton(null);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onHelp();
          }}
        >
          <RoundedPlane width={buttonWidth} height={buttonHeight} radius={0.03} />
          <meshStandardMaterial
            color={hoveredButton === "help" ? "#A5D1E7" : "#66B9E2"}
            emissive={hoveredButton === "help" ? "#66B9E2" : "#66B9E2"}
            emissiveIntensity={hoveredButton === "help" ? 0.5 : 0.3}
          />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.04}
          color="#334155"
          anchorX="center"
          anchorY="middle"
          fontWeight={550}
        >
          Help
        </Text>
      </group>

      <group position={[0, 0.24, 0]}>
        <mesh>
          <ButtonBackground width={buttonWidth} height={buttonHeight} radius={0.03} colorTop="#000000" colorBottom="#000000" opacity={0.15} />
        </mesh>
      </group>

      {showAlignmentToggle && alignmentMode && onToggleAlignment && (
        <>
          <group position={[0, 0.11, 0.01]}>
            <mesh
              onPointerEnter={(e) => {
                e.stopPropagation();
                setHoveredButton("alignment");
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                setHoveredButton(null);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onToggleAlignment();
              }}
            >
              <RoundedPlane width={buttonWidth} height={buttonHeight} radius={0.03} />
              <meshStandardMaterial
                color={hoveredButton === "alignment" ? "#A5D1E7" : "#66B9E2"}
                emissive={hoveredButton === "alignment" ? "#66B9E2" : "#66B9E2"}
                emissiveIntensity={hoveredButton === "alignment" ? 0.5 : 0.3}
              />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.04}
              color="#334155"
              anchorX="center"
              anchorY="middle"
              fontWeight={550}
            >
              {alignmentMode === "world" ? "Switch to Free Roam" : "Switch to World Align"}
            </Text>
          </group>

          <group position={[0, 0.1, 0]}>
            <mesh>
              <ButtonBackground width={buttonWidth} height={buttonHeight} radius={0.03} colorTop="#000000" colorBottom="#000000" opacity={0.15} />
            </mesh>
          </group>
        </>
      )}

      <group position={[0, yBelowHelp, 0]}>
        {/* Mode Switch */}
        {onToggleTransparency && (
          <>
            <group position={[0, -0.075, 0.01]}>
              <mesh
                onPointerEnter={(e) => {
                  e.stopPropagation();
                  setHoveredButton("transparency");
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  setHoveredButton(null);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onToggleTransparency();
                }}
              >
                <RoundedPlane width={buttonWidth} height={buttonHeight} radius={0.03} />
                <meshStandardMaterial
                  color={hoveredButton === "transparency" ? "#A5D1E7" : "#66B9E2"}
                  emissive={hoveredButton === "transparency" ? "#66B9E2" : "#66B9E2"}
                  emissiveIntensity={hoveredButton === "transparency" ? 0.5 : 0.3}
                />
              </mesh>
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.04}
                color="#334155"
                anchorX="center"
                anchorY="middle"
                fontWeight={550}
              >
                {homeTransparent ? "Switch to VR" : "Switch to AR"}
              </Text>
            </group>

            <group position={[0, -0.088, 0]}>
              <mesh>
                <ButtonBackground width={buttonWidth} height={buttonHeight} radius={0.03} colorTop="#000000" colorBottom="#000000" opacity={0.15} />
              </mesh>
            </group>
          </>
        )}

        {/* Back Button */}
        <group position={[0, -0.215, 0.01]}>
          <mesh
            onPointerEnter={(e) => {
              e.stopPropagation();
              setHoveredButton("back");
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              setHoveredButton(null);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onBack();
            }}
          >
            <RoundedPlane width={buttonWidth} height={buttonHeight} radius={0.03} />
            <meshStandardMaterial
              color={hoveredButton === "back" ? "#A5D1E7" : "#66B9E2"}
              emissive={hoveredButton === "back" ? "#66B9E2" : "#66B9E2"}
              emissiveIntensity={hoveredButton === "back" ? 0.5 : 0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.04}
            color="#334155"
            anchorX="center"
            anchorY="middle"
            fontWeight={550}
          >
            Back to Home
          </Text>
        </group>

        <group position={[0, -0.228, 0]}>
          <mesh>
            <ButtonBackground width={buttonWidth} height={buttonHeight} radius={0.03} colorTop="#000000" colorBottom="#000000" opacity={0.15} />
          </mesh>
        </group>

        {/* Logout Button */}
        <group position={[0, -0.355, 0.01]}>
          <mesh
            onPointerEnter={(e) => {
              e.stopPropagation();
              setHoveredButton("logout");
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              setHoveredButton(null);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onLogout();
            }}
          >
            <RoundedPlane width={buttonWidth} height={buttonHeight} radius={0.03} />
            <meshStandardMaterial
              color={hoveredButton === "logout" ? "#FF8F8F" : "#fd7171"}
              emissive={hoveredButton === "logout" ? "#fd7171" : "#fd7171"}
              emissiveIntensity={hoveredButton === "logout" ? 0.5 : 0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.04}
            color="#334155"
            anchorX="center"
            anchorY="middle"
            fontWeight={550}
          >
            Logout
          </Text>
        </group>

        <group position={[0, -0.368, 0]}>
          <mesh>
            <ButtonBackground width={buttonWidth} height={buttonHeight} radius={0.03} colorTop="#000000" colorBottom="#000000" opacity={0.15} />
          </mesh>
        </group>
      </group>
    </group>
  );
}