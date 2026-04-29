import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { SettingsComponent } from '@/components/settings';
import TabScrollView from '@/components/tab-scroll-view';

export default function SettingsScreen() {
    return (
        <TabScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            >
            <ThemedView style={styles.titleContainer}>
                <ThemedText
                    type="title"
                    style={{
                        fontFamily: Fonts.rounded,
                    }}>
                    Settings
                </ThemedText>

            </ThemedView>
            <ThemedView style={styles.stepContainer}>
            <SettingsComponent/>
            </ThemedView>
        </TabScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },

    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
