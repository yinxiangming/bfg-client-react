# Management language selection

Contract version is 1.0.0. The client baseline is `eb649ab09662051cc1eb480c434d9efa4bc25ac5`.

Administration and console routes offer the supported interface languages independently of the storefront language catalog. The language control reflects the current interface locale. Explicit locale preferences persist across navigation and refresh.

The storefront configuration provider leaves preference persistence to the language control. Request locale resolution already selects the configured site language for visitors without an explicit preference.

Storefront language options continue to derive from the configured site catalog. Verification covers a site with one configured language and a user choosing another management language, including a page refresh and navigation.

These changes belong to the shared configuration provider and language control because both serve all installed applications.
