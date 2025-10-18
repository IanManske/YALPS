{
  description = "Nix development shell for this repo.";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = import nixpkgs { inherit system; }; in
        {
          devShells.default = with pkgs; mkShell {
            buildInputs = [
              nodejs
              pnpm
            ];
            packages = [];
          };
        }
      );
}
