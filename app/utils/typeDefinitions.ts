interface NavItemsProps {
  name: string;
  location: string;
  icon: string;
  description: string;
}

export interface NavbarItemsProps {
  name: string;
  icon: string;
  conversionType: "image" | "pdf" | "document" | "media" | "developer";
  itemsList: NavItemsProps[];
}
