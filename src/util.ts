import { useLocation } from "react-router-dom";

export const useShareId = () => {
  const { pathname } = useLocation();
  return pathname.split("/share/")[1];
};
