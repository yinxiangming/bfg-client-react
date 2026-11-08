# Address lookup country context v1

Contract version `1.0.0`.
Client baseline `fedb77ba76bf91110d38817f89fb65b8c8230b4b`.
Dispatch record `docs/contracts/address-country-dispatch.json`.

The shared address lookup hook accepts an optional country code. Suggestions
and resolution carry that code to the existing server resources using the
optional `country_code` query parameter. The reusable address field exposes
the same optional prop. Reverse-geocoding callers can supply the same context.

Existing callers without a country retain the current request shapes. A
country change cancels in-flight work, clears suggestions and starts a new
autocomplete session. Usage-cap state remains workspace-scoped. Selecting a
country does not bypass server authorization or activation.

This increment changes a shared data hook and its optional field prop. It
introduces no skin package, business route, account policy or global default.
Existing host color modes and field rendering remain in effect.
