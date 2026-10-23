-- Revoke EXECUTE from PUBLIC on the trigger function (not meant to be called via RPC)
REVOKE EXECUTE ON FUNCTION trigger_order_status_automation() FROM PUBLIC;