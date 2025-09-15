// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OpenDUPR",
    platforms: [
        .iOS(.v18)
    ],
    products: [
        .library(
            name: "OpenDUPR",
            targets: ["OpenDUPR"])
    ],
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.10.0")
    ],
    targets: [
        .target(
            name: "OpenDUPR",
            dependencies: [
                "Alamofire",
                "Kingfisher"
            ]),
        .testTarget(
            name: "OpenDUPRTests",
            dependencies: ["OpenDUPR"])
    ]
)