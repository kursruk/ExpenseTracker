{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.sqlite-interactive
    pkgs.mc
    pkgs.rsync
    pkgs.openssh
  ];
}
