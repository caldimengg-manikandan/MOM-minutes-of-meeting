import argostranslate.package

def list_packages():
    print("Updating package index...")
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()
    print(f"Found {len(available_packages)} packages.")
    
    tamil_packages = [pkg for pkg in available_packages if pkg.from_code == 'ta' or pkg.to_code == 'ta']
    if tamil_packages:
        print("Tamil packages found:")
        for pkg in tamil_packages:
            print(f"- {pkg.from_code} -> {pkg.to_code}")
    else:
        print("No Tamil packages found in the official index.")

if __name__ == "__main__":
    list_packages()
