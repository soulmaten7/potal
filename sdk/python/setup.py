from setuptools import setup, find_packages

setup(
    name="potal",
    version="1.1.0",
    description="POTAL — Total Landed Cost API SDK",
    author="POTAL",
    author_email="contact@potal.app",
    url="https://www.potal.app/developers",
    packages=find_packages(),
    python_requires=">=3.8",
    extras_require={"async": ["aiohttp>=3.8"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
