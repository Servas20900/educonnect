import { useContext } from 'react';
import { SystemConfigContext } from '../contexts/SystemConfigContext';

export default function useSystemConfig() {
  return useContext(SystemConfigContext);
}
