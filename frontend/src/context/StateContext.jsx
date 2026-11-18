import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import centralConfigData from '../config/central.config.json';
import upConfigData from '../config/up.config.json';
import {
  INDIAN_STATES,
  DEFAULT_STATE_CODE,
  getStateByCode,
  getActiveStates,
  getComingSoonStates
} from '../config/states';

const StateContext = createContext(null);

// Static map of loaded state configuration files
const STATE_CONFIGS = {
  UP: upConfigData
};

export function StateProvider({ children }) {
  const [activeStateCode, setActiveStateCode] = useState(DEFAULT_STATE_CODE);
  const [comingSoonTarget, setComingSoonTarget] = useState(null);

  // Active state metadata
  const currentState = useMemo(() => {
    return getStateByCode(activeStateCode);
  }, [activeStateCode]);

  // Active state specific JSON config
  const stateConfig = useMemo(() => {
    return STATE_CONFIGS[activeStateCode] || STATE_CONFIGS[DEFAULT_STATE_CODE];
  }, [activeStateCode]);

  // Select state handler: switches if active, or triggers ComingSoon modal if not yet live
  const selectState = useCallback((targetCode) => {
    const target = getStateByCode(targetCode);
    if (!target) return;

    if (target.status === 'ACTIVE_PILOT') {
      setActiveStateCode(target.code);
      setComingSoonTarget(null);
    } else {
      // Non-pilot states trigger the informational opt-in modal without switching active logic
      setComingSoonTarget(target);
    }
  }, []);

  const closeComingSoon = useCallback(() => {
    setComingSoonTarget(null);
  }, []);

  // Feature-level readiness check rather than a blanket boolean
  const isFeatureEnabled = useCallback((featureKey) => {
    if (!stateConfig || !stateConfig.featureReadiness) return false;
    const feat = stateConfig.featureReadiness[featureKey];
    return feat ? feat.status === 'ACTIVE' : false;
  }, [stateConfig]);

  const getFeatureDetails = useCallback((featureKey) => {
    if (!stateConfig || !stateConfig.featureReadiness) {
      return { status: 'UNAVAILABLE', label: featureKey, description: 'Not configured for active state.' };
    }
    return stateConfig.featureReadiness[featureKey] || {
      status: 'UNAVAILABLE',
      label: featureKey,
      description: 'Feature is not supported in current state jurisdiction.'
    };
  }, [stateConfig]);

  const value = useMemo(() => ({
    currentState,
    activeStateCode,
    stateConfig,
    centralConfig: centralConfigData,
    selectState,
    comingSoonTarget,
    closeComingSoon,
    isFeatureEnabled,
    getFeatureDetails,
    allStates: INDIAN_STATES,
    activeStates: getActiveStates(),
    comingSoonStates: getComingSoonStates()
  }), [
    currentState,
    activeStateCode,
    stateConfig,
    selectState,
    comingSoonTarget,
    closeComingSoon,
    isFeatureEnabled,
    getFeatureDetails
  ]);

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
}

export function useCurrentState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useCurrentState must be used within a StateProvider');
  }
  return context;
}

export default StateContext;
