import { Button, Notification } from "@mantine/core";
import { useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function InstallUpdateNotification() {
  const {
    offlineReady: [_, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const onClose = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const onUpdate = useCallback(async () => {
    updateServiceWorker(true);
  }, []);

  return needRefresh ? (
    <Notification title="Update available!" onClose={onClose}>
      Click{" "}
      <Button compact onClick={onUpdate}>
        Update now
      </Button>{" "}
      to get the latest version.
    </Notification>
  ) : null;
}
