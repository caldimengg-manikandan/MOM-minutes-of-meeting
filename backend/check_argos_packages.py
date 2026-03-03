import argostranslate.package

def list_packages():
    print("Updating package index...")
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()
    print(f"Found {len(available_packages)} packages.")
    
    print("\nChecking for Tamil (ta) packages:")
    ta_packages = [pkg for pkg in available_packages if pkg.from_code == 'ta' or pkg.to_code == 'ta']
    for pkg in ta_packages:
        print(f"- {pkg.from_code} -> {pkg.to_code}")

    print("\nChecking for Hindi (hi) packages:")
    hi_packages = [pkg for pkg in available_packages if pkg.from_code == 'hi' or pkg.to_code == 'hi']
    for pkg in hi_packages:
        print(f"- {pkg.from_code} -> {pkg.to_code}")

if __name__ == "__main__":
    list_packages()
