import {render} from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('<HomeScreen />', () => {
    test('Text Renders Correctly on HomeScreen', () => {
        const { getByText} = render(<HomeScreen/>);
        getByText("Bluetooth Scanner");
    })
})
