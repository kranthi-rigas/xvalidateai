import { useToastContext } from '../context/ToastContext';

export default function useToast() {
  const { show } = useToastContext();
  return show;
}
