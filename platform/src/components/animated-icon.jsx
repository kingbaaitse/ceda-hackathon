/**
 * The wrapper that gives a Lucide glyph its hover and tap animation.
 *
 * `lucide-animated-icons` animates every icon inside a trigger. We wrap each
 * icon in its own trigger so it reacts to hover and click on its own, without
 * the caller wiring anything up.
 *
 * This lives apart from `AnimatedIcons.jsx` so a module that needs two icons
 * does not pull in all fifty-five.
 */
import { forwardRef, useEffect, useRef } from 'react';
import { AnimatedIconTriggerContext, useAnimatedIconTrigger } from 'lucide-animated-icons/core';

export function animated(Icon) {
    const Component = forwardRef(function AnimatedIcon(props, ref) {
        const { hub, handlers } = useAnimatedIconTrigger();
        const timer = useRef(null);

        useEffect(() => () => clearTimeout(timer.current), []);

        const tap = () => {
            // `open` replays the hover scene even while the pointer rests on
            // the icon; `rest` first so a second tap replays it again.
            hub.emit('rest');
            hub.emit('open');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => hub.emit('rest'), 900);
        };

        return (
            <AnimatedIconTriggerContext.Provider value={hub}>
                <span
                    {...handlers}
                    style={{ display: 'contents' }}
                    onClick={tap}
                >
                    <Icon {...props} ref={ref} />
                </span>
            </AnimatedIconTriggerContext.Provider>
        );
    });
    Component.displayName = 'AnimatedIcon';
    return Component;
}
