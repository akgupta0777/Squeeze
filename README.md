# Squeeze
<div align='center'>
  <a href="https://github.com/akgupta0777/Squeeze">
    <img width="200" height="200" src="https://github.com/akgupta0777/Squeeze/assets/51379307/63538498-6607-46b1-89ab-22248f1f0568" />
  </a>
  <h1>Squeeze</h1>
  <p>
    Squeeze is a module bundler. It's main purpose is to bundle javascript files in a single file.
  </p>
  <em>Squeezes your javascript code just like you squeeze lemons.</em>
</div>

<h2 align="center">Install</h2>

Install with npm:
```bash
npm i --save-dev @akgupta0777/squeeze
```

Install with yarn:
```bash
yarn add @akgupta0777/squeeze --dev
```
<h2 align="center">Usage</h2>

```
squeeze build                    : Bundles your code by looking at the default configuration file.
squeeze build <Config Path>      : Bundles your code by looking at the specified configuration file.
squeeze build <Options>          : Bundles your code by specified options entered by user.
  <Options>
     --entry or -e               : Option for entry file path for squeeze.
     --output or -o              : Option for output folder path for squeeze.
     --filename or -f            : Option for bundled filename for squeeze.
squeeze init                     : Creates a configuration file for you.
squeeze help                     : Help and information related to squeeze commands.
```

<h2 align="center">Demo</h2>

https://github.com/akgupta0777/Squeeze/assets/51379307/0c357617-e2f2-4721-915b-79c16ce47bec
