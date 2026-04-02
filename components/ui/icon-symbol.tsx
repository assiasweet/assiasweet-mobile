// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = string;

const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>["name"]> = {
  // Navigation principale
  "house.fill": "home",
  "storefront.fill": "store",
  "cart.fill": "shopping-cart",
  "bag.fill": "shopping-bag",
  "person.fill": "person",
  // Staff navigation
  "chart.bar.fill": "bar-chart",
  "list.bullet": "list",
  "cube.box.fill": "inventory",
  "person.2.fill": "group",
  "bell.fill": "notifications",
  // Actions
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "plus": "add",
  "minus": "remove",
  "trash.fill": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "xmark": "close",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  "star.fill": "star",
  "heart.fill": "favorite",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "qrcode.viewfinder": "qr-code-scanner",
  "barcode.viewfinder": "qr-code-scanner",
  "camera.fill": "camera-alt",
  "doc.fill": "description",
  "doc.text.fill": "article",
  "location.fill": "location-on",
  "truck.box.fill": "local-shipping",
  "creditcard.fill": "credit-card",
  "banknote.fill": "account-balance",
  "clock.fill": "schedule",
  "calendar": "calendar-today",
  "filter": "filter-list",
  "arrow.up.arrow.down": "swap-vert",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "lock.fill": "lock",
  "envelope.fill": "email",
  "phone.fill": "phone",
  "building.2.fill": "business",
  "tag.fill": "local-offer",
  "percent": "percent",
  "leaf.fill": "eco",
  "drop.fill": "water-drop",
  "flame.fill": "local-fire-department",
  "sparkles": "auto-awesome",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "printer.fill": "print",
  "download": "download",
  "upload": "upload",
  "wifi.slash": "wifi-off",
  "exclamationmark.circle.fill": "error",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
