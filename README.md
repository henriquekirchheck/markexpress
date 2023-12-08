# markespress

## A Simple markdown file server middleware for express

Usage:

```js
import { markdown } from "markexpress";
app.use("/", markdown("./{markdown_folder_to_be_served}"));
app.use("/", markdown("./{markdown_folder_to_be_served}", {
  strip: true // Strip .md from url (default {true})
  fallback: true // Fallback to other middleware in case of error (default {true})
}));
```

Type definitions are available.
