#/usr/bin/bash

applet_uuid="WinTenMenu@Abiddarris"
dest=~
dest="${dest}/.local/share/cinnamon/applets/${applet_uuid}"

rm -rf "$dest"
mkdir "$dest"
for file in ./*; do
    if [ "$(basename "$file")" = "install.sh" ]; then
        continue
    fi
    cp -a "$file" "$dest"
done
