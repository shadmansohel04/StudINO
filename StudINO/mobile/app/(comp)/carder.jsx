import { useEffect } from "react";
import { StyleSheet, Dimensions, Image, Text } from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ROTATION_RANGE = 15;

export default function TinderCard({
    card,
    index,
    nextCardScale,
    panHandlers,
    translateX,
    translateY,
}) {
    const isTopCard = index === 0;
    const isSecondCard = index === 1;

    const leftOffset = useSharedValue(isTopCard ? 10 : -25);

    useEffect(() => {
        // Animate left offset when card becomes top card or not
        leftOffset.value = withTiming(isTopCard ? 10 : -25, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });
    }, [isTopCard]);

    const animatedStyle = useAnimatedStyle(() => {
        const currentX = isTopCard ? translateX.value : 0;
        const currentY = isTopCard ? translateY.value : 0;

        const rotate = isTopCard
            ? interpolate(
                  currentX,
                  [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                  [-ROTATION_RANGE, 0, ROTATION_RANGE],
                  Extrapolation.CLAMP
              )
            : 0;

        const scale = isTopCard ? 1 : isSecondCard ? nextCardScale.value : 0.8;

        return {
            transform: [
                { translateX: currentX + leftOffset.value },
                { translateY: currentY },
                { rotate: `${rotate}deg` },
                { scale },
            ],
            zIndex: 1000 - index,
        };
    });

    const nopeStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 4, 0],
            [1, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ rotate: "-20deg" }],
            position: "absolute",
            top: 40,
            left: 20,
            zIndex: 1001,
        };
    });

    const likeStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, SCREEN_WIDTH / 4],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ rotate: "20deg" }],
            position: "absolute",
            top: 40,
            right: 20,
            zIndex: 1001,
        };
    });

    const handlers = isTopCard ? panHandlers : {};

    return (
        <Animated.View style={[styles.container, animatedStyle]} {...handlers}>
            <Image source={{ uri: card.imgurl }} style={styles.image} />
            {isTopCard && (
                <>
                    <Animated.View style={nopeStyle}>
                        <Text style={[styles.label, styles.nope]}>NOPE</Text>
                    </Animated.View>
                    <Animated.View style={likeStyle}>
                        <Text style={[styles.label, styles.like]}>LIKE</Text>
                    </Animated.View>
                </>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_HEIGHT * 0.6,
        backgroundColor: "white",
        borderRadius: 15,
        position: "absolute",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
        overflow: "hidden",
    },
    image: {
        height: "100%",
        width: "100%",
        resizeMode: "cover",
    },
    label: {
        fontSize: 32,
        fontWeight: "800",
        padding: 10,
        borderWidth: 4,
        borderRadius: 10,
        textTransform: "uppercase",
    },
    nope: {
        color: "#ff2e54",
        borderColor: "#ff2e54",
        backgroundColor: "rgba(255, 46, 84, 0.1)",
    },
    like: {
        color: "#4ccc93",
        borderColor: "#4ccc93",
        backgroundColor: "rgba(76, 204, 147, 0.1)",
    },
});
