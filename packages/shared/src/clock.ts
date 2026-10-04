export interface ClockIntegrityCheck {
  clientCapturedAt: string;
  serverReceivedAt: string;
  clockSkewSeconds: number;
  isDriftFlagged: boolean;
  thresholdSeconds: number;
}

/**
 * Calculates clock skew and detects drift against a configurable threshold (default 300s / 5 minutes).
 */
export function checkClockIntegrity(
  clientCapturedAtStr: string,
  serverReceivedAtStr: string = new Date().toISOString(),
  thresholdSeconds: number = 300
): ClockIntegrityCheck {
  const clientTime = new Date(clientCapturedAtStr).getTime();
  const serverTime = new Date(serverReceivedAtStr).getTime();
  
  // clockSkew = serverReceivedAt - clientCapturedAt in seconds
  const clockSkewSeconds = Math.round((serverTime - clientTime) / 1000);
  const isDriftFlagged = Math.abs(clockSkewSeconds) > thresholdSeconds;

  return {
    clientCapturedAt: clientCapturedAtStr,
    serverReceivedAt: serverReceivedAtStr,
    clockSkewSeconds,
    isDriftFlagged,
    thresholdSeconds
  };
}
