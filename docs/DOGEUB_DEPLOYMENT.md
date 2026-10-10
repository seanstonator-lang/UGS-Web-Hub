# DogeUB deployment

DogeUB has a `ugs-dogeub` Render web service at
[https://ugs-dogeub.onrender.com](https://ugs-dogeub.onrender.com).
Render currently shows the account as suspended for suspicious activity, and
the public URL returns `Service Suspended`. The UGS hub and its single-file
build point to this address, but DogeUB will not open until Render restores the
account or the service is moved to another host and the links are updated.

The root `render.yaml` defines a free Node web service with `dogeub/` as its
root directory. It runs `npm ci && npm run build`, then `node server.js`.
Keep `dogeub/package-lock.json` committed so clean builds can install dependencies.
The service currently deploys from the `codex/dogeub-render` branch.

After a deployment, open the service URL and check the home page, loader route,
and proxy assets. A free Render service can take time to start after inactivity.
To rebuild the portable hub after changing its source, run
`npm run build:singlefile-hub` and copy the resulting `UGS-Web-Hub.html`.

`dogeub.ugswebhub.com` is not configured. To use that custom domain later, add
it in Render's Custom Domains settings and create the DNS record Render shows
at the domain provider. Update the hub links only after the domain is verified.
See [Render's custom domain guide](https://render.com/docs/custom-domains).
