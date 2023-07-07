import { Button, Notification } from "@mantine/core";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { resetUpdate, selectUpdateAvailable } from "../store/pwa";

export function InstallUpdateNotification() {
    const updateAvailable = useAppSelector(selectUpdateAvailable);
    const dispatch = useAppDispatch();

    const onClose = useCallback(() => dispatch(resetUpdate()), [dispatch]);

    const onUpdate = useCallback(async () => {
        dispatch(resetUpdate());

        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        window.location.reload();
    }, [dispatch]);

    return updateAvailable ? (
        <Notification title="Update available!" onClose={onClose}>
            Click{" "}
            <Button compact onClick={onUpdate}>
                Update now
            </Button>{" "}
            to get the latest version.
        </Notification>
    ) : null;
}
